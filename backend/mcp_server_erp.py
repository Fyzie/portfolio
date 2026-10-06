import os
from dotenv import load_dotenv
from supabase import create_client
from fastmcp import FastMCP

load_dotenv()

mcp = FastMCP(name="Factory ERP MCP Server")
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@mcp.tool()
def search_inventory_stock(item_query: str) -> list:
    """Searches inventory stock by item name or part type."""
    try:
        response = supabase.table("factory_inventory").select("*").ilike("item_name", f"%{item_query}%").execute()
        return response.data or []
    except Exception as e:
        return [{"error": str(e)}]

@mcp.tool()
def get_average_inventory_stock(department: str = None) -> dict:
    """Calculates average stock levels. Optionally filtered by department name."""
    try:
        query = supabase.table("factory_inventory").select("stock_number")
        if department:
            query = query.ilike("department", f"%{department}%")
        
        items = query.execute().data or []
        if not items:
            return {"average_stock": 0, "total_items": 0}
            
        total_stock = sum(item.get("stock_number", 0) for item in items)
        return {"average_stock": round(total_stock / len(items), 2), "total_items": len(items)}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    mcp.run(transport="sse", host="0.0.0.0", port=port)