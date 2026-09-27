import os
import glob
import json
import re
import math
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_DIR = os.path.join(BASE_DIR, "data", "knowledge_base")
VECTOR_STORE_DIR = os.path.join(BASE_DIR, "data", "vector_store")
INDEX_FILE = os.path.join(VECTOR_STORE_DIR, "kb_index.json")

def tokenize(text: str) -> List[str]:
    """Tokenizes text into lowercase words."""
    return re.findall(r'\w+', text.lower())

def split_text_into_chunks(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Splits text into chunks of approximate character size."""
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""

    for p in paragraphs:
        if len(current_chunk) + len(p) <= chunk_size:
            current_chunk += ("\n\n" + p if current_chunk else p)
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = p

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks

def build_vector_store():
    logger.info("Starting Agricultural Knowledge Base Ingestion Pipeline...")
    file_paths = glob.glob(os.path.join(KB_DIR, "*.md"))
    logger.info(f"Found {len(file_paths)} reference documents in {KB_DIR}")

    chunks_data: List[Dict[str, Any]] = []

    for file_path in file_paths:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            filename = os.path.basename(file_path)
            title = filename.replace(".md", "").replace("_", " ").title()

            doc_chunks = split_text_into_chunks(content)
            for idx, chunk in enumerate(doc_chunks):
                tokens = tokenize(chunk)
                term_freq = {}
                for t in tokens:
                    term_freq[t] = term_freq.get(t, 0) + 1

                chunks_data.append({
                    "id": f"{filename}#chunk{idx+1}",
                    "source": filename,
                    "title": title,
                    "content": chunk,
                    "term_freq": term_freq,
                    "token_count": len(tokens)
                })
        except Exception as e:
            logger.error(f"Error processing document {file_path}: {e}")

    logger.info(f"Generated {len(chunks_data)} searchable vector chunks.")

    # Calculate Inverse Document Frequency (IDF)
    doc_count = len(chunks_data)
    doc_freq: Dict[str, int] = {}
    for chunk in chunks_data:
        for term in chunk["term_freq"].keys():
            doc_freq[term] = doc_freq.get(term, 0) + 1

    idf: Dict[str, float] = {}
    for term, freq in doc_freq.items():
        idf[term] = math.log((doc_count + 1) / (freq + 1)) + 1.0

    os.makedirs(VECTOR_STORE_DIR, exist_ok=True)
    index_payload = {
        "chunks": chunks_data,
        "idf": idf,
        "doc_count": doc_count
    }

    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index_payload, f, indent=2)

    logger.info(f"Knowledge Base Index saved successfully to {INDEX_FILE}")

if __name__ == "__main__":
    build_vector_store()
