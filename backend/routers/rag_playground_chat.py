import os
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from routers.database import qdrant_aclient, qdrant_client, FALLBACK_MODELS

from llama_index.llms.google_genai import GoogleGenAI
from llama_index.core import VectorStoreIndex, Settings
from qdrant_client import QdrantClient, AsyncQdrantClient
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding

load_dotenv()
router = APIRouter(tags=["RAG Playground Chat"])

PLAYGROUND_KEY = os.getenv("RAG_GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY")

Settings.embed_model = GoogleGenAIEmbedding(
    model_name="gemini-embedding-001",
    api_key=PLAYGROUND_KEY
)

vector_store_pg = QdrantVectorStore(client=qdrant_client, aclient=qdrant_aclient, collection_name="playground_knowledge")
playground_index = VectorStoreIndex.from_vector_store(vector_store=vector_store_pg)

class PlaygroundChatRequest(BaseModel):
    message: str

async def playground_chat_with_fallback(chat_request_message):
    playground_prompt = (
        "You are an expert Factory Manual Guidance assistant for plant operators and maintenance engineers. "
        "Answer questions strictly and accurately based on the provided factory manuals. "
        "- Keep answers brief (maximum 2 to 3 short sentences). "
        "- Never output large bulleted lists or walls of text unless explicitly asked. "
    )

    for model_name in FALLBACK_MODELS:
        try:
            Settings.llm = GoogleGenAI(model=model_name, api_key=PLAYGROUND_KEY)
            temp_playground_engine = playground_index.as_chat_engine(
                chat_mode="condense_plus_context",
                system_prompt=playground_prompt,
                verbose=True
            )
            response = await temp_playground_engine.achat(chat_request_message)
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
    raise HTTPException(status_code=429, detail="Playground Gemini model quotas exhausted.")

@router.post("/api/playground-chat")
async def playground_chat_endpoint(request: PlaygroundChatRequest):
    try:
        result = await playground_chat_with_fallback(request.message)
        return {
            "reply": result["reply"],
            "model_used": result["model_used"],
            "num_source_nodes": result["num_source_nodes"],
            "source_nodes_details": result["source_nodes_details"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))