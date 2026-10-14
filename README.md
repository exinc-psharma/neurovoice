# NeuroVoice — Parkinson's Voice Pattern Analysis

NeuroVoice is a full-stack research prototype demonstrating the detection of dysarthric speech patterns associated with Parkinson's disease using sustained vowel phonations.

---

## Architecture Overview

```text
neurovoice_deploy/
├── backend/
│   ├── main.py                  # FastAPI entrypoint (POST /predict, GET /health)
│   ├── requirements.txt         # Backend Python dependencies
│   ├── services/
│   │   ├── audio_preprocessing.py   # Resampling (8kHz), normalization, silence trim
│   │   ├── feature_extraction.py    # 100 acoustic feature extraction (MFCCs, spectral, F0)
│   │   └── prediction.py            # ModelService loading pipeline & executing inference
│   └── model/
│       ├── best_exp_c_pipeline.joblib   # Promoted Exp C2 Random Forest classification pipeline
│       ├── model_config.json            # Model metadata, threshold, labels & disclaimers
│       └── exp_c_feature_columns.json   # 100 expected feature column names
├── frontend/
│   ├── index.html               # Web root
│   ├── package.json             # React dependencies
│   ├── vite.config.js           # Vite builder configuration
│   ├── vercel.json              # Client-side SPA routing rewrites
│   └── src/
│       ├── pages/               # Landing, Detection, Results, Info
│       └── services/api.js      # API client routing to VITE_API_URL
└── render.yaml                  # Render cloud Blueprint for backend deployment
```

---

## Deployment Instructions

### 1. Backend Deployment (Render)
1. Log in to [Render](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
2. Connect this repository (`neurovoice_deploy`).
3. Set configuration:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**:
   - `PYTHON_VERSION`: `3.11.9`
   - `CORS_ORIGINS`: `https://your-frontend-app.vercel.app,http://localhost:5173`
5. Click **Create Web Service**.  
   Note the assigned URL (e.g., `https://neurovoice-backend.onrender.com`).

---

### 2. Frontend Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
2. Import this repository (`neurovoice_deploy`).
3. Set configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click *Edit* and select `frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com` *(your live Render backend URL, without a trailing slash)*
5. Click **Deploy**.

---

### 3. Local Development
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## Disclaimer
NeuroVoice is an educational and research prototype demonstration exploring acoustic speech patterns. It is **NOT** a medical device, diagnostic system, or clinical screening instrument. Clinical diagnosis of Parkinson's disease requires comprehensive neurological examination by licensed healthcare specialists.
