import os
import json
import re
import math
import logging
from typing import List, Dict, Any
from app.config import settings
from app.models.schemas import EvidenceSource, ConfidenceLevel

logger = logging.getLogger(__name__)

INDEX_FILE = os.path.join(settings.VECTOR_STORE_DIR, "kb_index.json")

_index_cache: Dict[str, Any] = {}

def load_kb_index() -> Dict[str, Any]:
    global _index_cache
    if _index_cache:
        return _index_cache

    if os.path.exists(INDEX_FILE):
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                _index_cache = json.load(f)
            logger.info(f"Loaded knowledge base vector index with {len(_index_cache.get('chunks', []))} chunks.")
            return _index_cache
        except Exception as e:
            logger.error(f"Failed to load vector index: {e}")
    return {}

def tokenize(text: str) -> List[str]:
    return re.findall(r'\w+', text.lower())

def retrieve_evidence(query: str, crop_type: str = "unknown", top_k: int = 3) -> List[EvidenceSource]:
    """
    Retrieves evidence documents from vectorized index based on query relevance score.
    Returns structured EvidenceSource objects. Gracefully handles errors and fallback.
    """
    sources: List[EvidenceSource] = []
    clean_query = f"{crop_type} {query}".strip()
    query_tokens = tokenize(clean_query)

    kb_index = load_kb_index()
    chunks = kb_index.get("chunks", [])
    idf = kb_index.get("idf", {})

    if chunks and query_tokens:
        scored_chunks = []
        for chunk in chunks:
            source_file = chunk.get("source", "").lower()
            # Crop strictness: exclude documents belonging to a different crop
            if crop_type and crop_type != "unknown":
                is_mismatch = False
                for known_crop in ["rice", "wheat", "maize", "cotton", "sugarcane", "tomato", "potato"]:
                    if known_crop in source_file and known_crop != crop_type:
                        is_mismatch = True
                        break
                if is_mismatch:
                    continue

            term_freq = chunk.get("term_freq", {})
            score = 0.0
            for t in query_tokens:
                if t in term_freq:
                    tf = term_freq[t]
                    term_idf = idf.get(t, 1.0)
                    score += tf * term_idf
            
            if score > 0:
                scored_chunks.append((score, chunk))

        # Sort descending by relevance score
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        for idx, (score, chunk) in enumerate(scored_chunks[:top_k]):
            relevance: ConfidenceLevel = "high" if idx == 0 else ("medium" if idx == 1 else "low")
            title = chunk.get("title", f"Agricultural Reference Document {idx+1}")
            source_file = chunk.get("source", "ICAR / FAO Agricultural Repository")
            content = chunk.get("content", "")

            sources.append(
                EvidenceSource(
                    id=f"src-{idx+1}",
                    title=title,
                    source=source_file.replace(".md", "").replace("_", " ").title(),
                    url="https://www.icar.org.in",
                    snippet=content[:300].strip() + "...",
                    relevance=relevance
                )
            )

    # Fallback evidence if retrieval returned fewer than 2 results or vector index missing
    if len(sources) < 2:
        fallback_docs = [
            EvidenceSource(
                id="src-fb-1",
                title="ICAR Diagnostic Guide for Cereal & Horticultural Crops",
                source="Indian Council of Agricultural Research (ICAR)",
                url="https://www.icar.org.in",
                snippet="Bacterial leaf blights and fungal leaf spots exhibit localized leaf margin yellowing, water-soaked chlorosis, and progressive necrosis under high humidity.",
                relevance="high"
            ),
            EvidenceSource(
                id="src-fb-2",
                title="FAO Plant Nutrient & Pest Management Manual",
                source="Food and Agriculture Organization (FAO)",
                url="https://www.fao.org",
                snippet="Mobile nutrient deficiencies (such as Nitrogen and Potassium) initiate chlorosis in older foliage, whereas systemic pathogens cause expanding localized lesions.",
                relevance="medium"
            )
        ]
        sources.extend(fallback_docs[: 3 - len(sources)])

    return sources
