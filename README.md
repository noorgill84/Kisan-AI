# KisanAI - Production-Grade RAG Backend & Agricultural Advisory System

KisanAI is an AI-powered agronomy decision support system built to deliver evidence-backed crop symptom analysis, voice query processing, real-time weather integration, and tenant-isolated diagnosis history.

---

## 🌟 Key Architecture & Principles

- **Non-Negotiable Product Principle**: All diagnostic outputs are strictly framed as **decision support / possible causes**, never definitive claims. Every output includes a computed `confidence_level` (`high` | `medium` | `low`) and an `escalation_flag` triggering advisory guidance on low-confidence cases.
- **Multilingual Support**: Comprehensive localization for English (`en`), Hindi (`hi`), and Punjabi (`pa`).
- **Real RAG Pipeline**: Ingests 18 curated agricultural reference documents covering wheat, rice, maize, cotton, sugarcane, tomato, and potato diseases, pests, and deficiencies.
- **Strict Data Contracts**: Backend models conform 1-to-1 with TypeScript definitions in `src/types/index.ts`.
- **Fault-Tolerant Degraded Modes**: Graceful fallbacks at every stage (LLM API missing/timeout, STT failure, database disconnection).

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── config.py              # Settings & env variable loader
│   │   ├── main.py                # FastAPI app entrypoint & CORS setup
│   │   ├── models/
│   │   │   └── schemas.py         # Pydantic models matching src/types/index.ts
│   │   ├── routers/
│   │   │   ├── analyze.py         # POST /api/analyze
│   │   │   ├── transcribe.py      # POST /api/transcribe
│   │   │   ├── history.py         # GET /api/history
│   │   │   └── weather.py         # GET /api/weather
│   │   └── services/
│   │       ├── rag.py             # Vector store evidence retriever
│   │       ├── vision.py          # Multimodal LLM vision service (Gemini/GPT-4o)
│   │       ├── stt.py             # Speech-to-Text service (Whisper/Groq)
│   │       ├── reasoning.py       # Confidence, escalation & localization engine
│   │       └── db.py              # Supabase & memory persistence layer
│   ├── data/
│   │   ├── knowledge_base/        # 18 curated agricultural reference docs
│   │   └── vector_store/          # Vector index built by script
│   ├── scripts/
│   │   └── build_kb.py            # Knowledge base vector indexer
│   ├── tests/
│   │   └── run_tests.py           # Integration & schema validation test suite
│   ├── render.yaml                # Render deployment configuration
│   └── requirements.txt           # Python dependencies
├── project/                        # React + TypeScript Frontend
│   └── src/
│       ├── services/
│       │   └── api.ts             # Updated frontend API client
│       └── types/
│           └── index.ts           # Strict data contracts
├── render.yaml                     # Top-level Render deployment config
├── DEPLOYMENT.md                   # Step-by-step production deployment guide
└── README.md
```

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and update key values:

| Variable | Required | Description | Default |
| :--- | :--- | :--- | :--- |
| `ALLOWED_ORIGINS` | Yes | Allowed CORS origin URLs | `["https://kisan-ai.vercel.app", "http://localhost:5173"]` |
| `GEMINI_API_KEY` | Optional | Google Gemini 2.5 Flash Multimodal Key | `""` (Uses fallback reasoning if empty) |
| `OPENAI_API_KEY` | Optional | OpenAI GPT-4o / Whisper Key | `""` (Uses fallback STT/Vision if empty) |
| `GROQ_API_KEY` | Optional | Groq Whisper STT Key | `""` |
| `SUPABASE_URL` | Optional | Supabase Postgres URL | `""` (Uses isolated memory store if empty) |
| `SUPABASE_KEY` | Optional | Supabase Service Role Key | `""` |

---

## 🚀 Quickstart & Local Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Rebuild Knowledge Base Vector Index
python scripts/build_kb.py

# Run FastAPI dev server
python -m uvicorn app.main:app --reload --port 8000
```

Backend will be running at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

### 2. Run Integration Tests

```bash
python backend/tests/run_tests.py
```

### 3. Frontend Setup

```bash
cd project

# Install node dependencies
npm install

# Start Vite development server connected to local backend
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

---

## 🛠️ Rebuilding Knowledge Base Index

Whenever new reference documents are added to `backend/data/knowledge_base/`, run:

```bash
python backend/scripts/build_kb.py
```

This parses markdown documents, splits them into searchable chunks, computes TF-IDF/BM25 vectors, and updates `backend/data/vector_store/kb_index.json`.
