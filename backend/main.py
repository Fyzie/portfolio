
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

from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding


# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 8000))
#     uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

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


# @app.post("/chat")
# async def chat_endpoint(request: ChatRequest):
#     response = await chat_engine.achat(request.message)
#     return {"reply": str(response)}

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
                continue
            else:
                raise e
                
    raise HTTPException(
        status_code=429, 
        detail="All available Gemini free-tier model quotas have been exhausted for today."
    )

async def is_portfolio_related(question: str) -> bool:
    """Evaluates if the user's question is related to Hafizi's portfolio, tech stack, or engineering."""
    try:
        eval_llm = GoogleGenAI(model="gemini-3.6-flash", api_key=os.getenv("GOOGLE_API_KEY"))
        prompt = (
            f"Analyze this user question on an AI portfolio website for Muhammad Hafizi (a Machine Learning & Software Engineer specializing in AI, Computer Vision, FastAPI, Next.js, and robotics). "
            f"Question: '{question}'\n"
            f"Is this question related to Hafizi, his career, his technical skills, his projects, or software/AI/engineering topics? "
            f"Answer with ONLY one word: YES or NO."
        )
        response = await eval_llm.achat(prompt)
        return "YES" in str(response).upper()
    except Exception:
        # Fallback to True if evaluation fails so we don't block valid questions
        return True

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    session_id = request.session_id
    user_message = request.message.strip()
    
    # 1. Handle user typing their email during an active escalation state
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
            return {
                "reply": "I couldn't find a valid email address in your message. Please provide a valid email (e.g., yourname@domain.com) so I can forward your question to Hafizi."
            }

    # 2. Standard RAG Chat Flow
    try:
        result = await chat_with_fallback(user_message)
        reply_text = result["reply"]
        source_nodes = result["source_nodes"]
        
        # --- DEBUG TRACKING PRINTS ---
        print(f"\n--- DEBUG CHAT ---")
        print(f"User Query: {user_message}")
        print(f"Number of Source Nodes Found: {len(source_nodes)}")
        for i, node in enumerate(source_nodes):
            print(f"Node {i} Text Preview: {node.text[:100]}...")
        print(f"AI Reply: {reply_text}")
        print(f"--------------------\n")
        # -----------------------------

        # Better approach: Check if the AI's response itself states it doesn't know, 
        # combined with whether it's portfolio-related.
        is_missing_info = any(phrase in reply_text.lower() for phrase in [
            "isn't specifically listed", 
            "no mention of", 
            "i don't know", 
            "not stated", 
            "not mentioned",
            "do not have"
        ])
        
        if is_missing_info:
            is_relevant = await is_portfolio_related(user_message)
            print(f"Is Portfolio Related? {is_relevant}")
            
            if is_relevant:
                USER_SESSION_STATES[session_id] = {
                    "status": "waiting_for_email",
                    "pending_question": user_message
                }
                return {
                    "reply": "This isn't stated in my knowledge base. Would you like me to pass this question directly to Hafizi? Please leave your email address on the chat."
                }
                
        return {"reply": reply_text}
        
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
async def predict_garment_productivity(data: GarmentRegressRequest):
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

        # Get the uploaded file's content type (fallback to image/jpeg if missing)
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
            
        # Handle model cold start (Model loading)
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

# EMAIL BY SMRPLIB
"""
@app.post("/api/contact")
async def send_contact_email(form: ContactForm):
    sender_email = os.getenv("GMAIL_USER")
    sender_password = os.getenv("GMAIL_APP_PASS")

    if not sender_email or not sender_password:
        raise HTTPException(status_code=500, detail="Email service not configured on server.")
 
    msg = EmailMessage()
    msg.set_content(
        f"Name: {form.name}\n"
        f"Email: {form.email}\n"
        f"Phone: {form.phone or 'Not provided'}\n\n"
        f"Message:\n{form.message}"
    )
    msg["Subject"] = f"New Portfolio Message from {form.name}"
    msg["From"] = sender_email
    msg["To"] = "hafizimalik1998@gmail.com"

    try:
        # Connect to Gmail's SMTP server securely
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        return {"status": "success", "message": "Email sent successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
"""