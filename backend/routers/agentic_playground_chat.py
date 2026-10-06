import os
import re
import json
from pydantic import BaseModel
from dotenv import load_dotenv
from fastmcp import Client as MCPClient
from fastapi import APIRouter, HTTPException
from routers.database import qdrant_aclient, qdrant_client, FALLBACK_MODELS

from llama_index.llms.google_genai import GoogleGenAI
from llama_index.core import VectorStoreIndex, Settings
from llama_index.core.llms import ChatMessage, MessageRole
from qdrant_client import QdrantClient, AsyncQdrantClient
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding

load_dotenv()
router = APIRouter(tags=["Agentic Playground Chat"])

AGENT_KEY = os.getenv("AGENTIC_GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY")

Settings.embed_model = GoogleGenAIEmbedding(
    model_name="gemini-embedding-001",
    api_key=AGENT_KEY
)

vector_store_agentic = QdrantVectorStore(client=qdrant_client, aclient=qdrant_aclient, collection_name="agentic_knowledge")
agentic_index = VectorStoreIndex.from_vector_store(vector_store=vector_store_agentic)

class AgenticDispatchRequest(BaseModel):
    issue: str

def clean_agent_response(response_obj):
    text = str(response_obj).strip()
    text = re.sub(r'^(?:\*\*)?(?:assistant|model|user|system|agent|moderator verdict)(?:\*\*)?:\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^(?:assistant|model|user|system)\b\s*', '', text, flags=re.IGNORECASE)
    text = text.replace('*', '').replace('**', '').replace('### ', '').replace('###', '')
    return text.strip()

async def agentic_chat_with_fallback(chat_request_message):
    agentic_prompt = (
        "You are an expert Autonomous Maintenance Dispatch Agent. "
        "Answer questions strictly and accurately based on the provided factory maintenance paragraphs. "
        "- Keep answers brief (maximum 2 to 3 short sentences). "
        "- Never output large bulleted lists or walls of text unless explicitly asked. "
    )

    for model_name in FALLBACK_MODELS:
        try:
            Settings.llm = GoogleGenAI(model=model_name, api_key=AGENT_KEY)
            temp_agentic_engine = agentic_index.as_chat_engine(
                chat_mode="condense_plus_context",
                system_prompt=agentic_prompt,
                verbose=True
            )
            response = await temp_agentic_engine.achat(chat_request_message)
            source_nodes = getattr(response, "source_nodes", [])
            
            detailed_sources = []
            for node in source_nodes:
                detailed_sources.append({
                    "score": getattr(node, "score", None),
                    "text": node.text,
                    "metadata": node.metadata
                })
            
            return {
                "reply": str(response),
                "model_used": model_name,
                "num_source_nodes": len(source_nodes),
                "source_nodes_details": detailed_sources
            }
        except Exception as e:
            err_str = str(e)
            if any(code in err_str for code in ["429", "ResourceExhausted", "Quota exceeded", "503", "UNAVAILABLE", "ServerError"]):
                continue
            else:
                raise e
    raise HTTPException(status_code=429, detail="Agent Gemini model quotas exhausted.")

@router.post("/api/agentic-dispatch")
async def agentic_dispatch_endpoint(request: AgenticDispatchRequest):
    issue = request.issue.strip()
    if not issue:
        raise HTTPException(status_code=400, detail="Issue description is required.")
    
    try:
        rag_result = await agentic_chat_with_fallback(issue)
        repair_guidance = rag_result["reply"]
        rag_sources_text = "\n".join([node["text"] for node in rag_result["source_nodes_details"]])
        
        inventory_data = []
        selected_tool = "None"
        search_query = issue
        mcp_server_url = os.getenv("MCP_SERVER_URL", "http://localhost:8001/sse")
        
        async with MCPClient(mcp_server_url) as mcp_client:
            discovered_tools = await mcp_client.list_tools()
            tools_catalog = {t.name: t.description for t in discovered_tools}
            
            router_prompt = (
                f"You are an intelligent MCP Tool Router and Spare Part Extractor. \n"
                f"User Reported Issue: '{issue}'\n"
                f"RAG Manual Guidance & Source Context Retrieved:\n{rag_sources_text}\n\n"
                f"Available Tools Catalog (Name: Description):\n{json.dumps(tools_catalog, indent=2)}\n\n"
                f"Task: \n"
                f"1. Select the single most appropriate tool name from the catalog to check stock or statistics.\n"
                f"2. Identify the exact spare part name involved from the RAG manual guidance above.\n"
                f"Output format strictly as: TOOL_NAME | EXACT_SPARE_PART_NAME\n"
                f"Example output: search_inventory_stock | Extrusion Die Heater Band 500W\n"
                f"If no tool is relevant, output: NO TOOL NEEDED | none"
            )
            
            router_response_text = ""
            for model_name in FALLBACK_MODELS:
                try:
                    Settings.llm = GoogleGenAI(model=model_name, api_key=AGENT_KEY)
                    router_res = await Settings.llm.achat([ChatMessage(role=MessageRole.USER, content=router_prompt)])
                    router_response_text = router_res.message.content.strip() if hasattr(router_res, "message") else str(router_res).strip()
                    break
                except Exception as e:
                    if any(code in str(e) for code in ["429", "ResourceExhausted", "Quota exceeded", "503"]):
                        continue
                    raise e

            if "NO TOOL NEEDED" not in router_response_text.upper():
                parts = router_response_text.split("|")
                if len(parts) >= 1:
                    selected_tool = parts[0].strip()
                if len(parts) >= 2 and parts[1].strip().lower() != "none":
                    search_query = parts[1].strip()

                if selected_tool in tools_catalog:
                    tool_args = {"item_query": search_query} if selected_tool == "search_inventory_stock" else {}
                    tool_res = await mcp_client.call_tool(selected_tool, tool_args)
                    inventory_data = tool_res.content if hasattr(tool_res, "content") else []
                else:
                    selected_tool = "None"

        agent_prompt = (
            f"You are an Autonomous Maintenance Dispatch Agent. \n"
            f"Reported Issue: '{issue}'\n"
            f"RAG Manual Guidance Retrieved: '{repair_guidance}'\n"
            f"Dynamic MCP Tool Used: {selected_tool}\n"
            f"Exact Spare Part Queried: {search_query}\n"
            f"ERP Tool Result (Live Stock Data): {inventory_data}\n\n"
            f"Task: Synthesize a professional maintenance response. State clearly whether the required spare part is in stock based on the Tool Result, check exact quantities, and outline repair steps."
        )
        
        agent_response_text = ""
        used_model = rag_result["model_used"]
        for model_name in FALLBACK_MODELS:
            try:
                Settings.llm = GoogleGenAI(model=model_name, api_key=AGENT_KEY)
                agent_res = await Settings.llm.achat([ChatMessage(role=MessageRole.USER, content=agent_prompt)])
                agent_response_text = clean_agent_response(agent_res)
                used_model = model_name
                break
            except Exception as e:
                if any(code in str(e) for code in ["429", "ResourceExhausted", "Quota exceeded", "503"]):
                    continue
                raise e
                    
        return {
            "status": "success",
            "model_used": used_model,
            "ticket_summary": agent_response_text,
            "rag_sources": rag_result["source_nodes_details"],
            "tool_selected": selected_tool,
            "inventory_checked": inventory_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))