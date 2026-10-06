import os
import re
import resend
from typing import Dict, Any
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from routers.database import qdrant_aclient, qdrant_client, FALLBACK_MODELS

from llama_index.llms.google_genai import GoogleGenAI
from llama_index.core import VectorStoreIndex, Settings
from qdrant_client import QdrantClient, AsyncQdrantClient
from llama_index.core.llms import ChatMessage, MessageRole
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding

load_dotenv()
router = APIRouter(tags=["Portfolio Chat"])

PORTFOLIO_KEY = os.getenv("PORTFOLIO_GEMINI_KEY") or os.getenv("GOOGLE_API_KEY")

Settings.embed_model = GoogleGenAIEmbedding(
    model_name="gemini-embedding-001",
    api_key=PORTFOLIO_KEY
)

vector_store = QdrantVectorStore(client=qdrant_client, aclient=qdrant_aclient, collection_name="portfolio_knowledge")
index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

custom_prompt = (
    "You are a helpful AI assistant for Hafizi's portfolio. "
    "Your goal is to answer questions about Hafizi conversationally and concisely. "
    "CRITICAL RULES: "
    "- Keep answers brief (maximum 2 to 3 short sentences). "
    "- Never output large bulleted lists or walls of text unless the user explicitly asks for a 'full list' or 'details'. "
    "- Sound natural, friendly, and professional."
)

USER_SESSION_STATES: Dict[str, Dict[str, Any]] = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_user"

def extract_email(text: str):
    match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    return match.group(0) if match else None

async def chat_with_fallback(chat_request_message):
    for model_name in FALLBACK_MODELS:
        try:
            print(f"Portfolio Chat Response on {model_name}")
            Settings.llm = GoogleGenAI(model=model_name, api_key=PORTFOLIO_KEY)
            temp_chat_engine = index.as_chat_engine(
                chat_mode="condense_plus_context",
                system_prompt=custom_prompt,
                verbose=True
            )
            response = await temp_chat_engine.achat(chat_request_message)
            return {
                "reply": str(response), 
                "model_used": model_name,
                "source_nodes": getattr(response, "source_nodes", [])
            }
        except Exception as e:
            err_str = str(e)
            if any(code in err_str for code in ["429", "ResourceExhausted", "Quota exceeded", "503", "UNAVAILABLE", "ServerError"]):
                continue
            else:
                raise e
    raise HTTPException(status_code=429, detail="Portfolio Gemini model quotas exhausted.")

async def is_portfolio_related(question: str) -> bool:
    """Evaluates if the user's question is related to Hafizi's portfolio with full model fallback mechanism."""
    messages = [
        ChatMessage(
            role=MessageRole.USER, 
            content=(
                f"Analyze this user question about career path, work experience, work skills, compensation, or tech stack. "
                f"Question: {question}"
                f"Answer with ONLY one word: YES or NO."
            )
        )
    ]
    
    for model_name in FALLBACK_MODELS:
        try:
            eval_llm = GoogleGenAI(model=model_name, api_key=PORTFOLIO_KEY)
            response = await eval_llm.achat(messages)
            print(f"Portfolio Evaluation Response on {model_name}: {response}")
            return "YES" in str(response).upper()
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "ResourceExhausted" in err_str or "Quota exceeded" in err_str:
                print(f"is_portfolio_related {model_name}: Resource exhausted or quota exceeded!")
                continue
            else:
                print(f"is_portfolio_related error on {model_name}: {e}")
                continue
                
    print("Portfolio evaluation failed across all model fallbacks!")
    return False

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    session_id = request.session_id
    user_message = request.message.strip()
    email_escalation = False
    
    current_state = USER_SESSION_STATES.get(session_id, {})
    if current_state.get("status") == "waiting_for_email":
        email = extract_email(user_message)
        if email:
            original_question = current_state.get("pending_question", "Unknown question")
            try:
                resend.Emails.send({
                    "from": "Portfolio Assistant <onboarding@resend.dev>",
                    "to": ["hafizimalik1998@gmail.com"],
                    "subject": f"🚨 Portfolio Escalation Inquiry from {email}",
                    "html": f"""
                        <h3>New Unanswered Question Forwarded from Chatbot</h3>
                        <p><b>User's Email:</b> {email}</p>
                        <p><b>Exact Question Asked:</b></p>
                        <blockquote style="background: #f4f4f4; padding: 10px; border-left: 4px solid #3b82f6;">
                            {original_question}
                        </blockquote>
                    """
                })
            except Exception as e:
                print(f"Failed to send email: {e}")

            USER_SESSION_STATES.pop(session_id, None)
            return {
                "reply": f"Thank you! I've successfully forwarded your question and your email ({email}) directly to Hafizi. He will get back to you soon!"
            }
        else:
            email_text = "I couldn't find a valid email address in your message. "
            email_escalation = True
        USER_SESSION_STATES.pop(session_id, None)

    try:
        result = await chat_with_fallback(user_message)
        reply_text = result["reply"]
        
        is_missing_info = any(phrase in reply_text.lower() for phrase in [
            "isn't specifically listed", "isn't explicitly listed", "isn't highlighted",
            "isn't mentioned", "no mention of", "i don't know", "not stated", "not mentioned", "do not have"
        ])
        
        if is_missing_info:
            is_relevant = await is_portfolio_related(user_message)
            if is_relevant:
                USER_SESSION_STATES[session_id] = {
                    "status": "waiting_for_email",
                    "pending_question": user_message
                }
                return {
                    "reply": "This isn't stated in my knowledge base. Would you like me to pass this question directly to Hafizi? Please leave your email address on the chat."
                }

        if email_escalation:
            reply_text = email_text + reply_text
                
        return {"reply": reply_text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))