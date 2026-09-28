"""
FastAPI Server for Pathfinder 2e Character Builder & AI Studio
Exposes endpoints for LangChain chat, Hugging Face model management,
text-file knowledge ingestion (RAG), and serves the React UI.
"""

import os
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.model_service import model_service
from backend.knowledge_service import knowledge_service

app = FastAPI(
    title="Pathfinder 2e AI Character Forge & Studio",
    version="1.0.0",
    description="Backend API powered by LangChain and Hugging Face Transformers"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ChatRequest(BaseModel):
    message: str
    character_context: Optional[Dict[str, Any]] = None
    use_rag: bool = True
    custom_persona: Optional[str] = None

class IngestRequest(BaseModel):
    title: str
    content: str
    chunk_size: int = 500
    chunk_overlap: int = 50

class SearchRequest(BaseModel):
    query: str
    top_k: int = 3

class ModelLoadRequest(BaseModel):
    repo_id: str = "bartowski/Llama-3.2-3B-Instruct-GGUF"
    gguf_filename: str = "Llama-3.2-3B-Instruct-Q4_K_M.gguf"
    device_map: str = "auto"

class TacticsRequest(BaseModel):
    scenario: str
    scenario_params: Optional[Dict[str, Any]] = None
    character_context: Optional[Dict[str, Any]] = None

class BuildCharacterRequest(BaseModel):
    level: int = 19
    class_name: Optional[str] = "Fighter"
    ancestry_name: Optional[str] = "Human"
    heritage_name: Optional[str] = None
    background_name: Optional[str] = None
    archetype_name: Optional[str] = None
    requested_feats: Optional[List[str]] = None
    weapon_preference: Optional[str] = None
    hero_name: Optional[str] = None

# API Endpoints
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "PathfinderAI & Llama 3.2 Dual-Engine Backend"}

@app.get("/api/model/status")
def get_model_status():
    """Returns current model status, hardware info, GPU VRAM, and storage capacity."""
    return model_service.get_system_status()

@app.post("/api/model/load")
def load_model(req: ModelLoadRequest):
    """Loads model to GPU via Transformers / PyTorch on CUDA."""
    success = model_service.load_model_async(
        repo_id=req.repo_id,
        gguf_filename=req.gguf_filename
    )
    return {
        "success": success,
        "status": model_service.get_system_status()
    }

@app.post("/api/model/unload")
def unload_model():
    """Offloads the active model from GPU VRAM to reclaim memory and resume Zero-Latency Rules Engine mode."""
    result = model_service.unload_model()
    return result


@app.post("/api/chat")
def chat_with_ai(req: ChatRequest):
    """Processes a user prompt with character context and RAG knowledge."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    result = model_service.generate_chat_response(
        user_message=req.message,
        character_context=req.character_context,
        use_rag=req.use_rag,
        custom_persona=req.custom_persona
    )
    return result

@app.post("/api/tactics/advise")
def advise_tactics(req: TacticsRequest):
    """Calculates tactical 3-action economy advice based on current character setup and scenario."""
    if not req.scenario.strip():
        raise HTTPException(status_code=400, detail="Scenario description cannot be empty.")
    
    result = model_service.generate_tactical_advice(
        scenario=req.scenario,
        scenario_params=req.scenario_params,
        character_context=req.character_context
    )
    return result

@app.post("/api/character/generate")
def generate_character_endpoint(req: BuildCharacterRequest):
    """Generates a complete rules-legal character for any level (1-20) for the Character Builder."""
    from backend.character_builder import build_character
    return build_character(
        level=req.level,
        class_name=req.class_name,
        ancestry_name=req.ancestry_name,
        heritage_name=req.heritage_name,
        background_name=req.background_name,
        archetype_name=req.archetype_name,
        requested_feats=req.requested_feats,
        weapon_preference=req.weapon_preference,
        hero_name=req.hero_name
    )

@app.post("/api/knowledge/ingest")
def ingest_knowledge(req: IngestRequest):
    """Chunks and embeds custom text file content into LangChain vector memory."""
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")
    
    result = knowledge_service.ingest_text(
        title=req.title,
        text=req.content,
        chunk_size=req.chunk_size,
        chunk_overlap=req.chunk_overlap
    )
    return result

@app.get("/api/knowledge/documents")
def list_knowledge_documents():
    """Returns all ingested text documents."""
    return {"documents": knowledge_service.documents}

@app.post("/api/knowledge/search")
def search_knowledge(req: SearchRequest):
    """Searches indexed chunks using semantic/lexical similarity."""
    results = knowledge_service.search_similar(req.query, top_k=req.top_k)
    return {"results": results}

# Custom Feats & Excel Import Endpoints
@app.get("/api/feats/template")
def download_feat_template():
    """Generates and serves the official Excel template (.xlsx) for custom PF2e feats."""
    from backend.feat_excel_service import generate_feat_template_excel, TEMPLATE_PATH
    if not os.path.exists(TEMPLATE_PATH):
        generate_feat_template_excel()
    return FileResponse(
        TEMPLATE_PATH,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="Pathfinder_2e_Feats_Template.xlsx"
    )

@app.get("/api/feats/custom")
def list_custom_feats():
    """Returns all imported custom feats."""
    from backend.feat_excel_service import load_custom_feats
    return {"feats": load_custom_feats()}

@app.post("/api/feats/upload-excel")
async def upload_feats_excel(file: UploadFile = File(...)):
    """
    Parses an uploaded Excel file (.xlsx), validates the feat rows,
    persists them to custom feats storage, updates the Character Builder index,
    and ingests them into LangChain RAG vector memory for AI prompt synthesis.
    """
    if not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="Please upload a valid Excel spreadsheet (.xlsx).")

    contents = await file.read()
    from backend.feat_excel_service import parse_feat_excel, save_custom_feats
    valid_feats, warnings = parse_feat_excel(contents)

    if not valid_feats:
        raise HTTPException(
            status_code=400,
            detail=f"No valid feats could be parsed from {file.filename}. " + (warnings[0] if warnings else "Check template structure.")
        )

    # 1. Save to custom feats storage
    all_custom = save_custom_feats(valid_feats)

    # 2. Ingest into LangChain RAG vector store for AI Studio & Knowledge
    feats_md = f"# Custom Pathfinder 2e Feats Imported from {file.filename}\n\n"
    for f in valid_feats:
        traits_str = ', '.join(f.get('traits', [])) if f.get('traits') else 'None'
        feats_md += (
            f"### Feat: {f['name']} (Level {f['level']} {f['type']} Feat)\n"
            f"- **Actions**: {f.get('actions', 'Passive')}\n"
            f"- **Category/Class**: {f.get('category') or 'General'}\n"
            f"- **Traits**: {traits_str}\n"
            f"- **Prerequisites**: {f.get('prerequisites') or 'None'}\n"
            f"- **Trigger/Frequency**: {f.get('trigger') or 'None'}\n"
            f"- **Rules Effect**: {f['description']}\n"
            f"- **Source**: {f.get('source', 'Excel Import')}\n\n"
        )
    
    knowledge_service.ingest_text(
        title=f"Custom Feats ({file.filename})",
        text=feats_md,
        chunk_size=500,
        chunk_overlap=50
    )

    # 3. Refresh Character Builder feat indexing
    from backend.character_builder import refresh_vault_feats
    refresh_vault_feats()

    return {
        "success": True,
        "filename": file.filename,
        "imported_count": len(valid_feats),
        "total_custom_count": len(all_custom),
        "feats": valid_feats,
        "all_custom_feats": all_custom,
        "warnings": warnings
    }

@app.delete("/api/feats/custom/{feat_id}")
def delete_feat(feat_id: str):
    """Deletes a custom feat by ID."""
    from backend.feat_excel_service import delete_custom_feat
    from backend.character_builder import refresh_vault_feats
    remaining = delete_custom_feat(feat_id)
    refresh_vault_feats()
    return {"success": True, "remaining_count": len(remaining), "feats": remaining}

@app.post("/api/feats/clear")
def clear_feats():
    """Clears all custom feats."""
    from backend.feat_excel_service import clear_all_custom_feats
    from backend.character_builder import refresh_vault_feats
    clear_all_custom_feats()
    refresh_vault_feats()
    return {"success": True, "remaining_count": 0, "feats": []}


# Mount Frontend static build
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
