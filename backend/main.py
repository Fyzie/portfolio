import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import qdrant_client
from qdrant_client import AsyncQdrantClient
import smtplib
from email.message import EmailMessage
import resend

from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding

load_dotenv()

app = FastAPI(title="Portfolio AI Assistant Backend")

# Allow Next.js frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Match Google AI Settings
Settings.llm = GoogleGenAI(
    model="gemini-3.6-flash",
    api_key=os.getenv("GOOGLE_API_KEY")
)
Settings.embed_model = GoogleGenAIEmbedding(
    model_name="gemini-embedding-001",
    api_key=os.getenv("GOOGLE_API_KEY")
)

# 2. Connect to Qdrant Cloud
client = qdrant_client.QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# NEW: Create the asynchronous client
aclient = AsyncQdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

vector_store = QdrantVectorStore(
    client=client,
    aclient=aclient,
    collection_name="portfolio_knowledge"
)


# 3. Attach query engine to existing vector collection
index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

# NEW: Define strict behavioral rules for the bot
custom_prompt = (
    "You are a helpful AI assistant for Hafizi's engineering portfolio. "
    "Your goal is to answer questions about Hafizi conversationally and concisely. "
    "CRITICAL RULES: "
    "- Keep answers brief (maximum 2 to 3 short sentences). "
    "- Never output large bulleted lists or walls of text unless the user explicitly asks for a 'full list' or 'details'. "
    "- Sound natural, friendly, and professional."
)

# chat_engine = index.as_chat_engine(
#     chat_mode="condense_question",
#     verbose=True
# )

# chat engine with custom prompt
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

# RESEND
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


# SMRPLIB
"""
@app.post("/api/contact")
async def send_contact_email(form: ContactForm):
    sender_email = os.getenv("GMAIL_USER")       # Your Gmail address
    sender_password = os.getenv("GMAIL_APP_PASS") # Your Gmail App Password

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