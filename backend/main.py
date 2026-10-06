import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import (
    portfolio_chat,
    rag_playground_chat,
    agentic_playground_chat,
    ml_analytics,
    inventory,
    contact
)

load_dotenv()

app = FastAPI(title="Modular Portfolio & Factory AI Assistant Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio_chat.router)
app.include_router(rag_playground_chat.router)
app.include_router(agentic_playground_chat.router)
app.include_router(ml_analytics.router)
app.include_router(inventory.router)
app.include_router(contact.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"status": "Modular backend is running successfully"}