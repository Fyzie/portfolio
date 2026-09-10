import os
from dotenv import load_dotenv
import qdrant_client

from llama_index.core import (
    VectorStoreIndex, 
    SimpleDirectoryReader, 
    Settings, 
    StorageContext
)
from llama_index.vector_stores.qdrant import QdrantVectorStore

# NEW IMPORTS: Using the updated Google GenAI SDK integration
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

def main():
    print("1. Configuring Google Gemini AI...")
    
    Settings.llm = GoogleGenAI(
        model="gemini-3.6-flash", 
        api_key=GOOGLE_API_KEY
    )
    Settings.embed_model = GoogleGenAIEmbedding(
        model_name="gemini-embedding-001", 
        api_key=GOOGLE_API_KEY
    )

    print("2. Reading documents from ./data/ directory...")
    documents = SimpleDirectoryReader("./data").load_data()
    print(f"   -> Found and loaded {len(documents)} document fragments.")

    print("3. Connecting to Qdrant Cloud...")
    client = qdrant_client.QdrantClient(
        url=QDRANT_URL, 
        api_key=QDRANT_API_KEY,
    )
    
    vector_store = QdrantVectorStore(
        client=client, 
        collection_name="portfolio_knowledge"
    )
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    print("4. Generating embeddings and uploading to Qdrant. This may take a moment...")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        show_progress=True
    )
    
    print("Success! Your portfolio data is now vectorized and stored in Qdrant.")

if __name__ == "__main__":
    main()