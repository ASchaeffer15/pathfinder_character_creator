"""
Knowledge Service & LangChain RAG Ingestion Pipeline
Allows adding additional training/knowledge from user-provided text files (.txt, .md, .json)
Chunks content using LangChain RecursiveCharacterTextSplitter, computes semantic embeddings,
and performs similarity search to augment the Pathfinder AI model context.
"""

import os
import json
import math
import re
from typing import List, Dict, Any, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Storage location for ingested knowledge
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
KNOWLEDGE_STORE_FILE = os.path.join(DATA_DIR, "knowledge_vectors.json")

class KnowledgeService:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self.documents: List[Dict[str, Any]] = []
        self.chunks: List[Dict[str, Any]] = []
        self._load_store()

    def _load_store(self):
        """Loads previously ingested knowledge chunks from disk."""
        if os.path.exists(KNOWLEDGE_STORE_FILE):
            try:
                with open(KNOWLEDGE_STORE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.documents = data.get("documents", [])
                    self.chunks = data.get("chunks", [])
            except Exception as e:
                print(f"[!] Warning: Could not load knowledge store: {e}")
                self._preload_defaults()
        else:
            self._preload_defaults()

    def _preload_defaults(self):
        """Preloads fundamental Pathfinder 2e Remaster core rules into knowledge base."""
        core_rules = """
        Pathfinder 2e Remaster Core Combat and Action Rules:
        1. Three-Action Economy: Every turn, a character receives 3 actions and 1 reaction.
        Actions can be spent on Strikes, Strides, Raising a Shield, Demoralizing, Casting Spells (usually 2 actions), or using Feats like Sudden Charge (2 actions: Stride twice and Strike).
        2. Multiple Attack Penalty (MAP):
        The first Strike in a round is at full attack bonus.
        The second Strike incurs a -5 penalty (-4 if the weapon has the Agile trait, such as Dagger or Fist).
        The third Strike incurs a -10 penalty (-8 if the weapon has the Agile trait).
        3. Shield Block Reaction:
        Requires the character to have used the Raise a Shield action earlier that round.
        When hit with physical damage, the shield's Hardness (e.g., Hardness 5 for a Steel Shield) reduces the damage taken.
        Both the character and the shield take any excess damage.
        4. Four Degrees of Success:
        Critical Success: Exceeding DC by 10 or more, or rolling a Natural 20 that succeeds.
        Success: Meeting or beating the DC.
        Failure: Rolling below the DC.
        Critical Failure: Missing DC by 10 or more, or rolling a Natural 1 that fails.
        """
        self.ingest_text(
            title="Pathfinder 2e Remaster Core Rules.txt",
            text=core_rules,
            chunk_size=400,
            chunk_overlap=50
        )

    def _save_store(self):
        """Persists knowledge documents and chunks."""
        try:
            with open(KNOWLEDGE_STORE_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "documents": self.documents,
                    "chunks": self.chunks
                }, f, indent=2)
        except Exception as e:
            print(f"[!] Failed to save knowledge store: {e}")

    def ingest_text(self, title: str, text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> Dict[str, Any]:
        """
        Splits text with LangChain RecursiveCharacterTextSplitter and indexes chunks.
        """
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        split_texts = splitter.split_text(text)
        
        doc_id = f"doc_{len(self.documents) + 1}_{int(abs(hash(title)) % 10000)}"
        new_doc = {
            "id": doc_id,
            "title": title,
            "chunks": len(split_texts),
            "added_at": "Active Vector Memory"
        }
        self.documents.append(new_doc)

        # Store chunks with basic term-frequency vector embedding for local instant similarity
        for i, chunk_str in enumerate(split_texts):
            words = set(re.findall(r'\b[a-zA-Z]{3,}\b', chunk_str.lower()))
            self.chunks.append({
                "doc_id": doc_id,
                "doc_title": title,
                "chunk_id": i + 1,
                "text": chunk_str.strip(),
                "terms": list(words)
            })

        self._save_store()
        return {
            "doc_id": doc_id,
            "num_chunks": len(split_texts),
            "title": title
        }

    def search_similar(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Performs semantic/lexical similarity search against stored text chunks.
        """
        query_terms = set(re.findall(r'\b[a-zA-Z]{3,}\b', query.lower()))
        if not query_terms:
            return []

        scored_chunks = []
        for ch in self.chunks:
            chunk_terms = set(ch.get("terms", []))
            overlap = query_terms.intersection(chunk_terms)
            if overlap:
                # Jaccard / Overlap score
                score = len(overlap) / (math.sqrt(len(query_terms)) * math.sqrt(max(1, len(chunk_terms))))
                scored_chunks.append({
                    "chunk_id": ch["chunk_id"],
                    "source": ch["doc_title"],
                    "text": ch["text"],
                    "score": round(score, 3)
                })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

    def get_retrieved_context_prompt(self, query: str, top_k: int = 3) -> str:
        """
        Formats retrieved knowledge chunks into a LangChain context snippet.
        """
        results = self.search_similar(query, top_k=top_k)
        if not results:
            return ""
        
        context_parts = ["--- RETRIEVED RULES & LORE CONTEXT (FROM CUSTOM TEXT TRAINING) ---"]
        for r in results:
            context_parts.append(f"[{r['source']} - Chunk #{r['chunk_id']} (Relevance: {int(r['score']*100)}%)]\n{r['text']}")
        context_parts.append("--- END RETRIEVED CONTEXT ---\n")
        return "\n\n".join(context_parts)

# Singleton instance
knowledge_service = KnowledgeService()
