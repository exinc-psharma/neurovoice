"""
FastAPI Backend for Parkinson's-Related Voice Classification.

College Research Project Prototype.
Deploys Exp C1: Logistic Regression with ANOVA-F feature selection
via best_exp_c_pipeline.joblib.

Endpoints:
- GET  /         : Root endpoint with project metadata and disclaimer.
- GET  /health   : Health check endpoint confirming model status.
- POST /predict  : Upload WAV file -> preprocessing -> feature extraction -> prediction.
"""

import os
import time
import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from .services.audio_preprocessing import preprocess_audio, AudioValidationError
    from .services.feature_extraction import extract_features_vector
    from .services.prediction import ModelService
except ImportError:
    from services.audio_preprocessing import preprocess_audio, AudioValidationError
    from services.feature_extraction import extract_features_vector
    from services.prediction import ModelService


# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("parkinsons_api")

# Max upload file size: 25 MB
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: loads the joblib model once at application startup."""
    logger.info("Initializing Parkinson\'s Voice Classification Backend...")
    try:
        model_service = ModelService()
        app.state.model_service = model_service
        logger.info(
            f"Successfully loaded model: {model_service.pipeline_path.name} "
            f"({model_service.feature_count} features, threshold={model_service.decision_threshold:.2f})"
        )
    except Exception as exc:
        logger.error(f"Failed to load model pipeline on startup: {exc}", exc_info=True)
        raise exc
    yield
    logger.info("Shutting down Parkinson\'s Voice Classification Backend.")


app = FastAPI(
    title="Parkinson\'s Voice Pattern Classification API",
    description=(
        "College research prototype for classifying sustained vowel ('ah') voice recordings "
        "using temporal/spectral acoustic dynamics and regularized logistic regression. "
        "NOT a clinical diagnostic tool."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# ------------------------------------------------------------------------------
# CORS Middleware Configuration
# ------------------------------------------------------------------------------
# Default allowed origins for local development; configurable via environment variable
cors_env = os.getenv(
    "CORS_ORIGINS","https://neurovoice-client.onrender.com"
    # "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
)
allowed_origins: List[str] = [origin.strip() for origin in cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------
@app.get("/", tags=["Info"])
async def root() -> Dict[str, Any]:
    """Root metadata and disclaimer endpoint."""
    return {
        "project": "Parkinson\'s Voice Pattern Classification",
        "type": "Educational and College Research Prototype",
        "status": "online",
        "deployed_model": "Exp C1 (Logistic Regression with ANOVA-F feature selection)",
        "endpoints": {
            "health_check": "GET /health",
            "prediction": "POST /predict"
        },
        "disclaimer": (
            "This system is a research prototype designed for voice pattern analysis. "
            "It is NOT a medical device and does NOT provide medical diagnoses."
        )
    }


@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, Any]:
    """Health check endpoint to verify backend status and model loading."""
    model_service: ModelService = getattr(app.state, "model_service", None)
    is_loaded = model_service is not None and model_service.pipeline is not None
    return {
        "status": "ok" if is_loaded else "degraded",
        "model_loaded": is_loaded,
        "model_name": "Exp C1  Logistic Regression (ANOVA-F)",
        "features_expected": model_service.feature_count if is_loaded else 0,
        "decision_threshold": model_service.decision_threshold if is_loaded else 0.50
    }


@app.post("/predict", tags=["Prediction"])
async def predict_voice(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Accepts an uploaded WAV voice recording, runs preprocessing, extracts acoustic features,
    and returns model classification with class probabilities.
    """
    start_time = time.perf_counter()

    # 1. Validate file presence
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": "No file uploaded. Please provide a WAV audio file.",
                "error_type": "MissingFileError"
            }
        )

    # 2. Validate file extension
    filename = file.filename
    if not filename.lower().endswith(".wav"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": f"Unsupported file type for '{filename}'. Only .wav audio recordings are accepted.",
                "error_type": "UnsupportedFormatError"
            }
        )

    # 3. Read audio bytes and check size
    try:
        audio_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": f"Failed to read uploaded file: {exc}",
                "error_type": "FileReadError"
            }
        )

    if len(audio_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": "Uploaded file is empty (0 bytes).",
                "error_type": "EmptyFileError"
            }
        )

    if len(audio_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
                "error_type": "FileSizeExceededError"
            }
        )

    # 4. Audio Preprocessing
    try:
        y_proc = preprocess_audio(audio_bytes)
    except AudioValidationError as ave:
        logger.warning(f"Audio validation failed for '{filename}': {ave}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": str(ave),
                "error_type": "AudioValidationError"
            }
        )
    except Exception as exc:
        logger.error(f"Unexpected error during preprocessing for '{filename}': {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": f"Audio preprocessing failed: {exc}",
                "error_type": "PreprocessingError"
            }
        )

    # 5. Feature Extraction
    model_service: ModelService = getattr(app.state, "model_service", None)
    if model_service is None or model_service.pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": "Model service is uninitialized."}
        )

    try:
        feature_vector = extract_features_vector(
            y=y_proc,
            feature_columns=model_service.feature_columns,
            sr=8000
        )
    except Exception as exc:
        logger.error(f"Feature extraction failed for '{filename}': {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": f"Feature extraction failed: {exc}",
                "error_type": "FeatureExtractionError"
            }
        )

    # 6. Model Prediction
    try:
        result = model_service.predict(feature_vector)
    except Exception as exc:
        logger.error(f"Prediction failed for '{filename}': {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": f"Model inference error: {exc}",
                "error_type": "InferenceError"
            }
        )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
    result["filename"] = filename
    result["processing_time_ms"] = elapsed_ms

    logger.info(
        f"Processed '{filename}': {result['prediction_label']} "
        f"(PD Prob: {result['probability_parkinsons']:.4f}, latency: {elapsed_ms}ms)"
    )

    return result
