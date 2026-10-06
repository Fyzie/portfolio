import os
import cv2
import httpx
import joblib
import numpy as np
from pydantic import BaseModel
from dotenv import load_dotenv
from database import supabase, FALLBACK_MODELS
from supabase import create_client, Client as SupabaseClient
from fastapi import APIRouter, HTTPException, UploadFile, File

from llama_index.llms.google_genai import GoogleGenAI
from llama_index.core.llms import ChatMessage, MessageRole

load_dotenv()
router = APIRouter(tags=["ML & Analytics"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

model = joblib.load(os.path.join(BASE_DIR, "manufacturing_model.pkl")) if os.path.exists(os.path.join(BASE_DIR, "manufacturing_model.pkl")) else None
fault_classifier = joblib.load(os.path.join(BASE_DIR, "industrial_fault_model.pkl")) if os.path.exists(os.path.join(BASE_DIR, "industrial_fault_model.pkl")) else None
garment_regressor = joblib.load(os.path.join(BASE_DIR, "garments_regression_model.pkl")) if os.path.exists(os.path.join(BASE_DIR, "garments_regression_model.pkl")) else None

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

class DebateRequest(BaseModel):
    topic: str

@router.post("/api/forecast")
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

@router.post("/api/industrial-fault-classify")
async def classify_fault_state(data: FaultClassifyRequest):
    try:
        probabilities = fault_classifier.predict_proba([[data.vibration, data.temperature, data.pressure]])[0].tolist() if fault_classifier else [0.70, 0.20, 0.10]
            
        if supabase:
            supabase.table("analytics_logs").insert({
                "task_type": "classification",
                "inputs": {"vibration": data.vibration, "temperature": data.temperature, "pressure": data.pressure},
                "outputs": {"probabilities": probabilities}
            }).execute()

        return {"status": "success", "probabilities": probabilities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/garments-regression")
async def ref_predict_garment_productivity(data: GarmentRegressRequest):
    try:
        predicted_productivity = float(garment_regressor.predict([[data.targeted_productivity, data.smv, data.over_time, data.incentive, data.no_of_workers]])[0]) if garment_regressor else 0.82

        if supabase:
            supabase.table("analytics_logs").insert({
                "task_type": "regression",
                "inputs": {
                    "targeted_productivity": data.targeted_productivity, "smv": data.smv,
                    "over_time": data.over_time, "incentive": data.incentive, "no_of_workers": data.no_of_workers
                },
                "outputs": {"predicted_productivity": predicted_productivity}
            }).execute()

        return {"status": "success", "predicted_productivity": predicted_productivity}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/cv-detect")
async def cv_detect(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")
        
        h, w, _ = img.shape
        hf_token = os.getenv("HUGGINGFACE_API_KEY")
        headers = {"Authorization": f"Bearer {hf_token}", "Content-Type": file.content_type or "image/jpeg"} if hf_token else {"Content-Type": file.content_type or "image/jpeg"}
        
        async with httpx.AsyncClient() as httpx_client:
            response = await httpx_client.post(
                "https://router.huggingface.co/hf-inference/models/facebook/detr-resnet-50",
                headers=headers, content=contents, timeout=60.0
            )
            
        if response.status_code == 503:
            est_time = response.json().get("estimated_time", 15) if response.headers.get("content-type") == "application/json" else 15
            raise HTTPException(status_code=503, detail=f"Model is waking up from sleep. Please wait ~{int(est_time)}s and try again!")

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Hugging Face error: {response.text}")
            
        raw_preds = response.json()
        detections = []
        for item in raw_preds:
            box = item.get("box", {})
            xmin, ymin, xmax, ymax = box.get("xmin", 0), box.get("ymin", 0), box.get("xmax", 0), box.get("ymax", 0)
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
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/debate")
async def debate_endpoint(request: DebateRequest):
    topic = request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required.")
        
    for model_name in FALLBACK_MODELS:
        try:
            eval_llm = GoogleGenAI(model=model_name, api_key=os.getenv("GOOGLE_API_KEY"))
            arch_res = await eval_llm.achat([ChatMessage(role=MessageRole.USER, content=f"Topic: '{topic}'. Argue from the perspective of The Pragmatic Architect. Keep short (max 2 sentences). No prefixes.")])
            evang_res = await eval_llm.achat([ChatMessage(role=MessageRole.USER, content=f"Topic: '{topic}'. The Architect argued: '{str(arch_res)}'. Rebut from the perspective of The Scalability Evangelist. Keep short. No prefixes.")])
            mod_res = await eval_llm.achat([ChatMessage(role=MessageRole.USER, content=f"Topic: '{topic}'. Architect: '{str(arch_res)}'. Evangelist: '{str(evang_res)}'. Provide a concise moderator summary in max 2 sentences. No prefixes.")])
            
            def clean(obj):
                return re.sub(r'^(assistant|model|user|system):\s*', '', str(obj).strip(), flags=re.IGNORECASE).strip()

            return {
                "status": "success", "model_used": model_name,
                "architect": clean(arch_res), "evangelist": clean(evang_res), "moderator": clean(mod_res)
            }
        except Exception:
            continue
    raise HTTPException(status_code=429, detail="Debate model quotas exhausted.")

@router.get("/api/get-history")
async def get_history(task_type: str = "forecast"):
    if not supabase:
        return {"data": []}
    response = supabase.table("analytics_logs").select("*").eq("task_type", task_type).order("created_at", desc=True).limit(5).execute()
    return {"data": response.data}