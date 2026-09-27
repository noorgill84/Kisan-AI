# KisanAI Production Deployment Guide

This guide details step-by-step instructions to deploy the KisanAI FastAPI backend to **Render** and reconnect the live **Vercel** frontend.

---

## 🏗️ Step 1: Deploy Backend to Render

1. **Push Repository to GitHub / GitLab**:
   Ensure all changes are committed and pushed to your git repository.

2. **Create New Web Service on Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click **New +** -> **Web Service**.
   - Connect your KisanAI repository.

3. **Configure Build & Start Commands**:
   - **Root Directory**: `backend` (or leave empty if using root `render.yaml`)
   - **Environment**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python scripts/build_kb.py
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```

4. **Set Environment Variables in Render**:
   Add the following under **Environment**:
   - `ALLOWED_ORIGINS`: `https://kisan-ai.vercel.app,http://localhost:5173` (replace with your exact Vercel URL)
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `OPENAI_API_KEY`: *(Your OpenAI API Key for GPT-4o / Whisper)*
   - `SUPABASE_URL`: *(Optional Supabase URL for persistent storage)*
   - `SUPABASE_KEY`: *(Optional Supabase Service Key)*

5. **Deploy**:
   Click **Create Web Service**. Wait for the build to finish.
   Copy your backend service URL (e.g. `https://kisan-ai-backend.onrender.com`).

---

## 🔗 Step 2: Reconnect Vercel Frontend

1. **Log in to Vercel Dashboard**:
   Navigate to your deployed `kisan-ai` project settings on Vercel.

2. **Add Environment Variables**:
   Go to **Settings** -> **Environment Variables** and add:
   - `VITE_API_BASE_URL`: `https://kisan-ai-backend.onrender.com`
   - `VITE_USE_MOCK`: `false`

3. **Trigger Redeployment**:
   Go to **Deployments** tab -> Select latest commit -> Click **Redeploy**.

---

## 🧪 Step 3: Verify Live Integration

1. Open your live Vercel web app.
2. Navigate to **Diagnosis**.
3. Upload a crop leaf photo or enter symptoms text.
4. Click **Analyze Symptoms**.
5. Confirm that the application displays:
   - Evidence sources retrieved from RAG knowledge base
   - Decision support causes with confidence level badge
   - Escalation guidance for low confidence cases
   - Localized language switching (English, Hindi, Punjabi)
