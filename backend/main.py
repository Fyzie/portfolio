import re
import os
import cv2
import httpx
import joblib
import resend
import uvicorn
import smtplib
import numpy as np
import qdrant_client
from typing import Dict, Any
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from qdrant_client import QdrantClient, AsyncQdrantClient
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, UploadFile, File

from llama_index.llms.google_genai import GoogleGenAI
from llama_index.core import VectorStoreIndex, Settings
from llama_index.core.llms import ChatMessage, MessageRole
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding

load_dotenv()

app = FastAPI(title="Portfolio AI Assistant Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"status": "Backend is running"}

Settings.llm = GoogleGenAI(
    model="gemini-3.6-flash",
    api_key=os.getenv("GOOGLE_API_KEY")
)
Settings.embed_model = GoogleGenAIEmbedding(
    model_name="gemini-embedding-001",
    api_key=os.getenv("GOOGLE_API_KEY")
)

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)
aclient = AsyncQdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

vector_store = QdrantVectorStore(
    client=client,
    aclient=aclient,
    collection_name="portfolio_knowledge"
)

index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

# Global initialization for playground knowledge index (matching portfolio index)
vector_store_pg = QdrantVectorStore(
    client=client,
    aclient=aclient,
    collection_name="playground_knowledge"
)
playground_index = VectorStoreIndex.from_vector_store(vector_store=vector_store_pg)

custom_prompt = (
    "You are a helpful AI assistant for Hafizi's portfolio. "
    "Your goal is to answer questions about Hafizi conversationally and concisely. "
    "CRITICAL RULES: "
    "- Keep answers brief (maximum 2 to 3 short sentences). "
    "- Never output large bulleted lists or walls of text unless the user explicitly asks for a 'full list' or 'details'. "
    "- Sound natural, friendly, and professional."
)

chat_engine = index.as_chat_engine(
    chat_mode="condense_plus_context",
    system_prompt=custom_prompt,
    verbose=True
)

USER_SESSION_STATES: Dict[str, Dict[str, Any]] = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_user"

def extract_email(text: str):
    """Extracts a valid email address using Regex."""
    match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    return match.group(0) if match else None

FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash"
]

async def chat_with_fallback(chat_request_message):
    for model_name in FALLBACK_MODELS:
        try:
            print(f"Portfolio Chat Response on {model_name}")
            Settings.llm = GoogleGenAI(
                model=model_name,
                api_key=os.getenv("GOOGLE_API_KEY")
            )
            
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
            if "429" in err_str or "ResourceExhausted" in err_str or "Quota exceeded" in err_str:
                print(f"{model_name}: Resource exhausted or quota exceeded!")
                continue
            else:
                raise e
                
    raise HTTPException(
        status_code=429, 
        detail="All available Gemini free-tier model quotas have been exhausted for today."
    )

async def playground_chat_with_fallback(chat_request_message):
    playground_prompt = (
        "You are an expert Factory Manual Guidance assistant for plant operators and maintenance engineers. "
        "Answer questions strictly and accurately based on the provided factory manuals. "
        "- Keep answers brief (maximum 2 to 3 short sentences). "
        "- Never output large bulleted lists or walls of text unless explicitly asked. "
    )

    for model_name in FALLBACK_MODELS:
        try:
            print(f"Playground Chat Response on {model_name}")
            Settings.llm = GoogleGenAI(
                model=model_name,
                api_key=os.getenv("GOOGLE_API_KEY")
            )
            
            temp_playground_engine = playground_index.as_chat_engine(
                chat_mode="condense_plus_context",
                system_prompt=playground_prompt,
                verbose=True
            )
            
            response = await temp_playground_engine.achat(chat_request_message)
            source_nodes = getattr(response, "source_nodes", [])
            
            # Extract detailed source information (Question & Answer/Text used)
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
            print(f"Playground error on {model_name}: {err_str}")
            if "429" in err_str or "ResourceExhausted" in err_str or "Quota exceeded" in err_str:
                print(f"Playground {model_name}: Resource exhausted or quota exceeded!")
                continue
            else:
                raise e
                
    raise HTTPException(
        status_code=429, 
        detail="All available Gemini free-tier model quotas have been exhausted for today."
    )

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
            eval_llm = GoogleGenAI(model=model_name, api_key=os.getenv("GOOGLE_API_KEY"))
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

@app.post("/chat")
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
        source_nodes = result["source_nodes"]
        
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

class PlaygroundChatRequest(BaseModel):
    message: str

@app.post("/api/playground-chat")
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

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    message: str

resend.api_key = os.getenv("RESEND_API_KEY")

@app.post("/api/contact")
async def send_contact_email(form: ContactForm):
    if not resend.api_key:
        raise HTTPException(status_code=500, detail="Resend API key not configured on server.")

    try:
        params = {
            "from": "Portfolio Contact <onboarding@resend.dev>",
            "to": ["hafizimalik1998@gmail.com"],
            "subject": f"New Portfolio Message from {form.name}",
            "html": f"""
                <h3>New Message from Portfolio Contact Form</h3>
                <p><b>Name:</b> {form.name}</p>
                <p><b>Email:</b> {form.email}</p>
                <p><b>Phone:</b> {form.phone or 'Not provided'}</p>
                <p><b>Message:</b></p>
                <p>{form.message}</p>
            """,
            "reply_to": form.email
        }
        response = resend.Emails.send(params)
        return {"status": "success", "message": "Email sent successfully!", "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
else:
    print("Warning: Supabase credentials not found.")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, "manufacturing_model.pkl")
model = joblib.load(model_path) if os.path.exists(model_path) else None

model_fault_path = os.path.join(BASE_DIR, "industrial_fault_model.pkl")
fault_classifier = joblib.load(model_fault_path) if os.path.exists(model_fault_path) else None

model_reg_path = os.path.join(BASE_DIR, "garments_regression_model.pkl")
garment_regressor = joblib.load(model_reg_path) if os.path.exists(model_reg_path) else None

class ForecastRequest(BaseModel):
    temp: float
    pressure: float
    speed: float

class FaultClassifyRequest(BaseModel):
    vibration: float
    temperature: float
    pressure: float

class GarmentRegressRequest(BaseModel):
    targeted_productivity: float
    smv: float
    over_time: int
    incentive: int
    no_of_workers: float

@app.post("/api/forecast")
async def generate_forecast(data: ForecastRequest):
    try:
        inputs_list = [data.temp, data.pressure, data.speed]
        prediction = model.predict(np.array([inputs_list]))[0].tolist() if model else [80, 79, 78, 77, 76]
        
        if supabase:
            supabase.table("analytics_logs").insert({
                "task_type": "forecast",
                "inputs": {"temp": data.temp, "pressure": data.pressure, "speed": data.speed},
                "outputs": {"forecast": prediction}
            }).execute()
        
        return {"status": "success", "forecast": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/industrial-fault-classify")
async def classify_fault_state(data: FaultClassifyRequest):
    try:
        if fault_classifier:
            inputs_arr = [[data.vibration, data.temperature, data.pressure]]
            probabilities = fault_classifier.predict_proba(inputs_arr)[0].tolist()
        else:
            probabilities = [0.70, 0.20, 0.10]
            
        if supabase:
            supabase.table("analytics_logs").insert({
                "task_type": "classification",
                "inputs": {
                    "vibration": data.vibration, 
                    "temperature": data.temperature, 
                    "pressure": data.pressure, 
                },
                "outputs": {"probabilities": probabilities}
            }).execute()

        return {"status": "success", "probabilities": probabilities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/garments-regression")
async def ref_predict_garment_productivity(data: GarmentRegressRequest):
    try:
        if garment_regressor:
            inputs_arr = [[data.targeted_productivity, data.smv, data.over_time, data.incentive, data.no_of_workers]]
            predicted_productivity = float(garment_regressor.predict(inputs_arr)[0])
        else:
            predicted_productivity = 0.82

        if supabase:
            supabase.table("analytics_logs").insert({
                "task_type": "regression",
                "inputs": {
                    "targeted_productivity": data.targeted_productivity,
                    "smv": data.smv,
                    "over_time": data.over_time,
                    "incentive": data.incentive,
                    "no_of_workers": data.no_of_workers
                },
                "outputs": {"predicted_productivity": predicted_productivity}
            }).execute()

        return {"status": "success", "predicted_productivity": predicted_productivity}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cv-detect")
async def cv_detect(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")
        
        h, w, _ = img.shape
        hf_token = os.getenv("HUGGINGFACE_API_KEY")
        content_type = file.content_type or "image/jpeg"
        
        headers = {
            "Authorization": f"Bearer {hf_token}",
            "Content-Type": content_type
        } if hf_token else {"Content-Type": content_type}
        
        async with httpx.AsyncClient() as httpx_client:
            response = await httpx_client.post(
                "https://router.huggingface.co/hf-inference/models/facebook/detr-resnet-50",
                headers=headers,
                content=contents,
                timeout=60.0
            )
            
        if response.status_code == 503:
            try:
                err_json = response.json()
                est_time = err_json.get("estimated_time", 15)
                raise HTTPException(
                    status_code=503, 
                    detail=f"Model is waking up from sleep. Please wait ~{int(est_time)}s and try again!"
                )
            except HTTPException as he:
                raise he
            except:
                raise HTTPException(status_code=503, detail="Model is loading, please try again in a few seconds.")

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Hugging Face error: {response.text}")
            
        raw_preds = response.json()
        if isinstance(raw_preds, dict) and "error" in raw_preds:
            raise HTTPException(status_code=500, detail=raw_preds["error"])

        detections = []
        for item in raw_preds:
            box = item.get("box", {})
            xmin = box.get("xmin", 0)
            ymin = box.get("ymin", 0)
            xmax = box.get("xmax", 0)
            ymax = box.get("ymax", 0)
            
            detections.append({
                "label": item.get("label", "object"),
                "confidence": round(float(item.get("score", 0.0)), 4),
                "box": [round(xmin, 2), round(ymin, 2), round(xmax, 2), round(ymax, 2)],
                "center_x": round(float((xmin + xmax) / 2.0), 2),
                "center_y": round(float((ymin + ymax) / 2.0), 2),
            })
                
        return {"status": "success", "detections": detections, "image_width": w, "image_height": h}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CV DETECT ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class DebateRequest(BaseModel):
    topic: str

@app.post("/api/debate")
async def debate_endpoint(request: DebateRequest):
    topic = request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required.")
        
    for model_name in FALLBACK_MODELS:
        try:
            print(f"Running Multi-Persona Debate on {model_name}")
            Settings.llm = GoogleGenAI(model=model_name, api_key=os.getenv("GOOGLE_API_KEY"))
            
            # 1. Pragmatic Architect Argument
            arch_messages = [ChatMessage(role=MessageRole.USER, content=f"Topic: '{topic}'. Argue from the perspective of The Pragmatic Architect (favoring simplicity, low overhead, and speed of delivery). Keep it short (maximum 2 sentences). Do not include any prefix labels like 'assistant:' or 'Architect:'.")]
            arch_res = await Settings.llm.achat(arch_messages)
            
            # 2. Scalability Evangelist Rebuttal
            evang_messages = [
                ChatMessage(role=MessageRole.USER, content=f"Topic: '{topic}'. The Architect argued: '{str(arch_res)}'. Rebut from the perspective of The Scalability Evangelist (favoring robust scaling and decoupled systems). Keep it short (maximum 2 sentences). Do not include any prefix labels like 'assistant:' or 'Evangelist:'.")
            ]
            evang_res = await Settings.llm.achat(evang_messages)
            
            # 3. Moderator Summary
            mod_messages = [
                ChatMessage(role=MessageRole.USER, content=f"Topic: '{topic}'. Architect said: '{str(arch_res)}'. Evangelist said: '{str(evang_res)}'. Provide a concise moderator verdict and summary in maximum 2 sentences. Do not include any prefix labels like 'assistant:' or 'Moderator Verdict:' in your response.")
            ]
            mod_res = await Settings.llm.achat(mod_messages)
            
            # Helper function to clean any accidental role prefixes or markdown role tags
            def clean_response(response_obj):
                text = str(response_obj).strip()
                # Remove unnecessary prefixes
                text = re.sub(r'^(assistant|model|user|system):\s*', '', text, flags=re.IGNORECASE)
                return text.strip()

            return {
                "status": "success",
                "model_used": model_name,
                "architect": clean_response(arch_res),
                "evangelist": clean_response(evang_res),
                "moderator": clean_response(mod_res)
            }
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "ResourceExhausted" in err_str or "Quota exceeded" in err_str:
                print(f"Debate {model_name}: Quota exceeded, falling back...")
                continue
            else:
                raise e
                
    raise HTTPException(status_code=429, detail="All available Gemini model quotas exhausted.")

@app.get("/api/get-history")
async def get_history(task_type: str = "forecast"):
    if not supabase:
        return {"data": []}
        
    response = (
        supabase.table("analytics_logs")
        .select("*")
        .eq("task_type", task_type)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    return {"data": response.data}

class InventoryUpdateRequest(BaseModel):
    item_id: int
    new_stock: int

@app.get("/api/inventory")
async def get_inventory(search: str = ""):
    if not supabase:
        return {"data": []}
    try:
        query = supabase.table("factory_inventory").select("*")
        if search:
            query = query.ilike("item_name", f"%{search}%")
        response = query.order("item_name").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/inventory/update")
async def update_inventory_stock(request: InventoryUpdateRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured.")
    try:
        response = supabase.table("factory_inventory").update({
            "stock_number": request.new_stock,
            "updated_at": "now()"
        }).eq("id", request.item_id).execute()
        return {"status": "success", "message": "Stock updated successfully", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AgenticDispatchRequest(BaseModel):
    issue: str

@app.post("/api/agentic-dispatch")
async def agentic_dispatch_endpoint(request: AgenticDispatchRequest):
    issue = request.issue.strip()
    if not issue:
        raise HTTPException(status_code=400, detail="Issue description is required.")
    
    try:
        # 1. RAG Step: Query playground knowledge base for procedure & spare part
        rag_result = await playground_chat_with_fallback(issue)
        repair_guidance = rag_result["reply"]
        
        # 2. MCP Step: Query Supabase inventory for spare parts status
        inventory_items = []
        if supabase:
            inv_res = supabase.table("factory_inventory").select("*").execute()
            inventory_items = inv_res.data or []
            
        # Let AI Agent synthesize RAG guidance + Inventory MCP data
        agent_prompt = (
            f"You are an Autonomous Maintenance Dispatch Agent. \n"
            f"Reported Issue: '{issue}'\n"
            f"RAG Manual Guidance Retrieved: '{repair_guidance}'\n"
            f"Live Inventory Database (MCP): {inventory_items}\n\n"
            f"Task: Synthesize a maintenance ticket. Identify the exact spare part needed, check if it is in stock from the inventory list, and outline the repair steps. Keep it professional and concise."
        )
        
        Settings.llm = GoogleGenAI(model="gemini-3.6-flash", api_key=os.getenv("GOOGLE_API_KEY"))
        agent_response = await Settings.llm.achat([ChatMessage(role=MessageRole.USER, content=agent_prompt)])
        
        return {
            "status": "success",
            "model_used": rag_result["model_used"],
            "ticket_summary": str(agent_response),
            "rag_sources": rag_result["source_nodes_details"],
            "inventory_checked": len(inventory_items)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))