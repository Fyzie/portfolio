import os
from dotenv import load_dotenv
from supabase import create_client
from fastmcp import FastMCP

load_dotenv()

# Initialize FastMCP Server
mcp = FastMCP(name="Factory ERP MCP Server")

# Initialize Supabase inside the MCP server
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@mcp.tool()
def search_factory_inventory(item_query: str) -> list:
    """Searches the factory inventory database for spare parts by name or type."""
    try:
        response = (
            supabase.table("factory_inventory")
            .select("*")
            .ilike("item_name", f"%{item_query}%")
            .execute()
        )
        return response.data or []
    except Exception as e:
        return [{"error": str(e)}]

if __name__ == "__main__":
    mcp.run(transport="sse", port=8001)