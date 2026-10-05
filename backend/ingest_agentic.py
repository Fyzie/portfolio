import os
import json
import time
from dotenv import load_dotenv
import qdrant_client

from llama_index.core import (
    VectorStoreIndex, 
    Document, 
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

    print("2. Reading manual3.json and converting to regular text paragraphs...")
    documents = []
    
    filepath = "D:/Github/portfolio/backend/data/manual3.json"
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            qa_list = data.get("qa_pairs", [])
            for item in qa_list:
                problem = item.get("problem", "")
                spare_part = item.get("spare_part_involved", "")
                dept = item.get("department", "")
                procedure = item.get("procedure", "")
                
                # Convert structured fields into a fluent, regular text paragraph
                regular_paragraph = (
                    f"In the {dept}, a reported factory issue occurred: {problem}. "
                    f"The required spare part involved is {spare_part}. "
                    f"Recommended repair procedure: {procedure}"
                )
                
                documents.append(Document(text=regular_paragraph, metadata={"source": "manual3.json", "department": dept}))
                
    print(f"   -> Converted {len(documents)} entries into regular text paragraphs.")

    print("3. Connecting to Qdrant Cloud for 'agentic_knowledge' collection...")
    client = qdrant_client.QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    
    vector_store = QdrantVectorStore(client=client, collection_name="agentic_knowledge")
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    print("4. Applying SentenceSplitter chunking...")
    splitter = SentenceSplitter(chunk_size=250, chunk_overlap=25)
    nodes = splitter.get_nodes_from_documents(documents)
    print(f"   -> Created {len(nodes)} chunks.")

    print("5. Uploading to Qdrant 'agentic_knowledge' with throttling...")
    index = VectorStoreIndex([], storage_context=storage_context)
    
    batch_size = 5  
    total_batches = (len(nodes) + batch_size - 1) // batch_size
    
    for i in range(0, len(nodes), batch_size):
        batch = nodes[i:i + batch_size]
        batch_num = i // batch_size + 1
        print(f"   -> Processing batch {batch_num} / {total_batches} ({len(batch)} nodes)...")
        
        success = False
        retries = 5
        backoff = 20
        
        while not success and retries > 0:
            try:
                index.insert_nodes(batch)
                success = True
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    print(f"      Rate limit hit (429). Backing off for {backoff} seconds... ({retries} retries left)")
                    time.sleep(backoff)
                    backoff *= 2
                    retries -= 1
                else:
                    raise e
        
        if not success:
            raise RuntimeError("Failed to complete ingestion due to persistent rate-limiting.")
        
        time.sleep(6)

    print("Success! manual3.json converted to text paragraphs and vectorized into 'agentic_knowledge'.")

if __name__ == "__main__":
    main()