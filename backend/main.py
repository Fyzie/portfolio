import os
import resend
import smtplib
import qdrant_client
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from qdrant_client import AsyncQdrantClient
from supabase import create_client, Client
import joblib
import numpy as np
import cv2
import httpx
from huggingface_hub import InferenceClient

from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.llms.google_genai import GoogleGenAI
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

Settings.llm = GoogleGenAI(
    model="gemini-3.6-flash",
    api_key=os.getenv("GOOGLE_API_KEY")
)
Settings.embed_model = GoogleGenAIEmbedding(
    model_name="gemini-embedding-001",
    api_key=os.getenv("GOOGLE_API_KEY")
)

client = qdrant_client.QdrantClient(
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

class ChatRequest(BaseModel):
    message: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    response = await chat_engine.achat(request.message)
    return {"reply": str(response)}

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
    rms_vibration: float
    mean_temp: float

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
            inputs_arr = [[data.vibration, data.temperature, data.pressure, data.rms_vibration, data.mean_temp]]
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
                    "rms_vibration": data.rms_vibration, 
                    "mean_temp": data.mean_temp
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

        client = InferenceClient(
            provider="hf-inference",
            api_key=hf_token,
        )

        # Pass bytes safely or use PIL Image
        raw_preds = client.object_detection(contents, model="facebook/detr-resnet-50")
        
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