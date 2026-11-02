import os
import re
import cv2
import json
import httpx
import joblib
import numpy as np
from pydantic import BaseModel
from dotenv import load_dotenv
from routers.database import supabase, FALLBACK_MODELS
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
    style: str = "Casual"

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
            if "no remaining credits" in response.text:
                raise HTTPException(status_code=500, detail=f"Sorry :) I dont have any remaining credits for this playground anymore. Please try others. Thanks.")
            else:
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
        
    style = (request.style or "Casual").strip().capitalize()
    if style not in ["Intellectual", "Casual", "Emotional"]:
        style = "Casual"

    if style == "Intellectual":
        prompt = (
            f"Debate topic: '{topic}'\n\n"
            f"Tone & Style: Intellectual, rigorous, and analytical. Use formal first-principles reasoning, precise engineering/philosophical concepts, and empirical trade-offs. 2-3 sentences each.\n\n"
            f"Return ONLY a raw JSON object (no markdown fences):\n"
            f'{{\n'
            f'  "architect": "Pragmatic Architect analyzing empirical reality, bounded efficiency constraints, and formal systems feasibility.",\n'
            f'  "evangelist": "Scalability Evangelist rebuttal arguing theoretical paradigm shifts, decoupled modularity, and exponential growth trajectories.",\n'
            f'  "moderator": "Technical Moderator verdict synthesizing the epistemological trade-offs between empirical constraints and theoretical upside."\n'
            f'}}'
        )
    elif style == "Emotional":
        prompt = (
            f"Debate topic: '{topic}'\n\n"
            f"Tone & Style: Emotional, passionate, and human-centric. Emphasize real human feelings, ethical stakes, burnout, craft dignity, empathy, and psychological impact. 2-3 sentences each.\n\n"
            f"Return ONLY a raw JSON object (no markdown fences):\n"
            f'{{\n'
            f'  "architect": "Pragmatic Architect passionately defending human sanity, craftsmanship, and protecting teams from exhausting complexity.",\n'
            f'  "evangelist": "Scalability Evangelist fiercely arguing with visionary zeal about human potential, breaking barriers, and daring to build a bolder future.",\n'
            f'  "moderator": "Technical Moderator empathetic verdict speaking to the heart, balancing human care with inspirational ambition."\n'
            f'}}'
        )
    else:  # Casual
        prompt = (
            f"Debate topic: '{topic}'\n\n"
            f"Tone & Style: Casual conversation in plain layman's terms (like two smart friends chatting over coffee). Use simple everyday analogies (e.g., cars, cooking, tools, sports). 2-3 sentences each.\n\n"
            f"Return ONLY a raw JSON object (no markdown fences):\n"
            f'{{\n'
            f'  "architect": "Pragmatic Architect defending simple, cost-effective solutions for today with a practical everyday example.",\n'
            f'  "evangelist": "Scalability Evangelist rebuttal pushing for future-proofing and growth with a vivid everyday analogy.",\n'
            f'  "moderator": "Technical Moderator verdict balancing both sides into a common-sense takeaway."\n'
            f'}}'
        )

    for model_name in FALLBACK_MODELS:
        try:
            eval_llm = GoogleGenAI(model=model_name, api_key=os.getenv("GOOGLE_API_KEY"))
            response = await eval_llm.achat([ChatMessage(role=MessageRole.USER, content=prompt)])
            raw_text = str(response).strip()
            
            # Clean possible markdown block markers
            clean_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
            clean_text = re.sub(r"\s*```$", "", clean_text, flags=re.MULTILINE).strip()
            
            architect, evangelist, moderator = "", "", ""
            try:
                data = json.loads(clean_text)
                architect = data.get("architect", "").strip()
                evangelist = data.get("evangelist", "").strip()
                moderator = data.get("moderator", "").strip()
            except Exception:
                arch_match = re.search(r'"architect"\s*:\s*"([^"]+)"', raw_text)
                evang_match = re.search(r'"evangelist"\s*:\s*"([^"]+)"', raw_text)
                mod_match = re.search(r'"moderator"\s*:\s*"([^"]+)"', raw_text)
                if arch_match and evang_match and mod_match:
                    architect = arch_match.group(1).strip()
                    evangelist = evang_match.group(1).strip()
                    moderator = mod_match.group(1).strip()

            def clean_prefix(s):
                return re.sub(r'^(architect|evangelist|moderator|assistant|model|user|system):\s*', '', s.strip(), flags=re.IGNORECASE).strip()

            if architect and evangelist and moderator:
                return {
                    "status": "success",
                    "model_used": model_name,
                    "style_used": style,
                    "architect": clean_prefix(architect),
                    "evangelist": clean_prefix(evangelist),
                    "moderator": clean_prefix(moderator)
                }
        except Exception as e:
            print(f"Debate attempt on {model_name} failed: {e}")
            continue
            
    raise HTTPException(status_code=429, detail="Debate model quotas exhausted.")

@router.get("/api/get-history")
async def get_history(task_type: str = "forecast"):
    if not supabase:
        return {"data": []}
    response = supabase.table("analytics_logs").select("*").eq("task_type", task_type).order("created_at", desc=True).limit(5).execute()
    return {"data": response.data}