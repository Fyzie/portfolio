import os
import re
import json
from routers.database import supabase
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from qdrant_client import QdrantClient, AsyncQdrantClient
from supabase import create_client, Client as SupabaseClient

from llama_index.core import VectorStoreIndex
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.core.llms import ChatMessage, MessageRole
from llama_index.vector_stores.qdrant import QdrantVectorStore

load_dotenv()
router = APIRouter(tags=["Inventory & ERP"])

client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
aclient = AsyncQdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
vector_store_agentic = QdrantVectorStore(client=client, aclient=aclient, collection_name="agentic_knowledge")
agentic_index = VectorStoreIndex.from_vector_store(vector_store=vector_store_agentic)

FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash"]

class InventoryUpdateRequest(BaseModel):
    item_id: int
    new_stock: int

class SmartInventoryAddRequest(BaseModel):
    item_name: str
    stock_number: int

@router.get("/api/inventory")
async def get_inventory(search: str = ""):
    if not supabase:
        return {"data": []}
    try:
        query = supabase.table("factory_inventory").select("*")
        if search:
            clean_search = search.strip()
            query = query.or_(f"item_name.ilike.%{clean_search}%,spare_part_type.ilike.%{clean_search}%")
        response = query.order("item_name").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        try:
            all_res = supabase.table("factory_inventory").select("*").order("item_name").execute()
            items = all_res.data or []
            if search:
                s = search.lower()
                items = [i for i in items if s in i.get("item_name", "").lower() or s in i.get("spare_part_type", "").lower()]
            return {"status": "success", "data": items}
        except Exception as inner_e:
            raise HTTPException(status_code=500, detail=str(inner_e))

@router.post("/api/inventory/update")
async def update_inventory_stock(request: InventoryUpdateRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured.")
    try:
        response = supabase.table("factory_inventory").update({
            "stock_number": request.new_stock, "updated_at": "now()"
        }).eq("id", request.item_id).execute()
        return {"status": "success", "message": "Stock updated successfully", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/inventory/add-smart")
async def add_smart_inventory_item(request: SmartInventoryAddRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured.")
    
    try:
        count_res = supabase.table("factory_inventory").select("id", count="exact").execute()
        total_rows = count_res.count if hasattr(count_res, 'count') else len(count_res.data or [])
        if total_rows >= 50:
            raise HTTPException(status_code=400, detail="Storage limit reached (Max 50 items).")
    except HTTPException as he:
        raise he
    except Exception:
        pass

    item_name = request.item_name.strip()
    stock_number = request.stock_number
    
    inferred_type, inferred_place, inferred_dept = "Mechanical", "Main Warehouse", "General Maintenance"
    
    for model_name in FALLBACK_MODELS:
        try:
            Settings_llm = GoogleGenAI(model=model_name, api_key=os.getenv("AGENT_GEMINI_KEY") or os.getenv("GOOGLE_API_KEY"))
            query_engine = agentic_index.as_query_engine()
            rag_res = query_engine.query(f"Find spare part type, storage location/shelf, and department for '{item_name}'.")
            
            meta_prompt = f"Based on context: '{str(rag_res)}' and item name '{item_name}', return JSON with keys: 'spare_part_type', 'item_place', 'department'. Output ONLY valid JSON."
            meta_res = await Settings_llm.achat([ChatMessage(role=MessageRole.USER, content=meta_prompt)])
            
            json_match = re.search(r'\{.*?\}', str(meta_res), re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                inferred_type = parsed.get("spare_part_type", inferred_type)
                inferred_place = parsed.get("item_place", inferred_place)
                inferred_dept = parsed.get("department", inferred_dept)
            break
        except Exception:
            continue
        
    try:
        insert_res = supabase.table("factory_inventory").insert({
            "item_name": item_name, "spare_part_type": inferred_type,
            "stock_number": stock_number, "item_place": inferred_place, "department": inferred_dept
        }).execute()
        return {"status": "success", "message": "Smart inventory item added successfully", "data": insert_res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/inventory/reset")
async def reset_factory_inventory_endpoint():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured.")
    try:
        supabase.table("factory_inventory").delete().gt("id", 5).execute()
        original_defaults = [
            {"id": 1, "item_name": "Hydraulic Seal Kit A-20", "spare_part_type": "Hydraulic", "stock_number": 14, "item_place": "Shelf 3B", "department": "Assembly Line 1"},
            {"id": 2, "item_name": "Pneumatic Valve Solenoid 24V", "spare_part_type": "Pneumatic", "stock_number": 8, "item_place": "Bin 12A", "department": "Packaging Unit"},
            {"id": 3, "item_name": "High-Temp Bearing SKF-6205", "spare_part_type": "Mechanical", "stock_number": 22, "item_place": "Rack 4C", "department": "Extrusion Press"},
            {"id": 4, "item_name": "Proximity Sensor Inductive M18", "spare_part_type": "Electrical", "stock_number": 5, "item_place": "Cabinet 2", "department": "Assembly Line 2"},
            {"id": 5, "item_name": "Extrusion Die Heater Band 500W", "spare_part_type": "Thermal", "stock_number": 3, "item_place": "Shelf 1A", "department": "Extrusion Press"}
        ]
        for item in original_defaults:
            supabase.table("factory_inventory").update({"stock_number": item["stock_number"], "updated_at": "now()"}).eq("id", item["id"]).execute()
        return {"status": "success", "message": "ERP inventory successfully reset to original state."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))