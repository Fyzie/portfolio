import os
import time
from dotenv import load_dotenv
import qdrant_client

from llama_index.core import (
    VectorStoreIndex, 
    SimpleDirectoryReader, 
    Settings, 
    StorageContext
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.vector_stores.qdrant import QdrantVectorStore

from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

def main():
    print("1. Configuring Google Gemini AI...")
    Settings.llm = GoogleGenAI(model="gemini-3.6-flash", api_key=GOOGLE_API_KEY)
    Settings.embed_model = GoogleGenAIEmbedding(model_name="gemini-embedding-001", api_key=GOOGLE_API_KEY)

    print("2. Reading JSON documents from ./data directory...")
    reader = SimpleDirectoryReader(input_dir="./data", required_exts=[".json"])
    documents = reader.load_data()
    print(f"   -> Loaded {len(documents)} JSON document files.")

    print("3. Connecting to Qdrant Cloud...")
    client = qdrant_client.QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    
    vector_store = QdrantVectorStore(client=client, collection_name="playground_knowledge")
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    print("4. Chunking documents...")
    # Smaller chunk size keeps the token count per request very low (< 2,500 tokens)
    splitter = SentenceSplitter(chunk_size=250, chunk_overlap=25)
    nodes = splitter.get_nodes_from_documents(documents)
    print(f"   -> Created {len(nodes)} chunks.")

    print("5. Uploading to Qdrant with rate-limit throttling...")
    index = VectorStoreIndex([], storage_context=storage_context)
    
    # Safe batching: 5 chunks per batch with a 6-second sleep (~10 requests/minute)
    batch_size = 5  
    total_batches = (len(nodes) + batch_size - 1) // batch_size
    
    for i in range(0, len(nodes), batch_size):
        batch = nodes[i:i + batch_size]
        batch_num = i // batch_size + 1
        print(f"   -> Processing batch {batch_num} / {total_batches} ({len(batch)} nodes)...")
        
        success = False
        retries = 5
        backoff = 20  # Starting backoff seconds
        
        while not success and retries > 0:
            try:
                index.insert_nodes(batch)
                success = True
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    print(f"      Rate limit hit (429). Backing off for {backoff} seconds... ({retries} retries left)")
                    time.sleep(backoff)
                    backoff *= 2  # Exponential backoff (20s, 40s, 80s...)
                    retries -= 1
                else:
                    raise e
        
        if not success:
            raise RuntimeError("Failed to complete ingestion due to persistent rate-limiting.")
        
        # Controlled sleep between successful batches to respect the 100 RPM limit
        time.sleep(6)

    print("Success! JSON factory manual data successfully vectorized in 'playground_knowledge'.")

if __name__ == "__main__":
    main()