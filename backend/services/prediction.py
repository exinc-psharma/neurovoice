"""
Prediction Service.

Loads the scikit-learn Pipeline (best_exp_c_pipeline.joblib), validates input shapes,
obtains predicted probabilities, and applies the frozen decision threshold from training.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import joblib


class ModelService:
    """
    Singleton service managing the trained joblib model and deployment config.
    """
    def __init__(self, model_dir: Optional[Path] = None):
        if model_dir is None:
            model_dir = Path(__file__).resolve().parent.parent / "model"
        self.model_dir = model_dir
        self.pipeline_path = self.model_dir / "best_exp_c_pipeline.joblib"
        self.columns_path = self.model_dir / "exp_c_feature_columns.json"
        self.config_path = self.model_dir / "model_config.json"

        self.pipeline: Any = None
        self.feature_columns: List[str] = []
        self.config: Dict[str, Any] = {}
        self.decision_threshold: float = 0.50
        self.class_mapping: Dict[str, str] = {
            "0": "Healthy voice pattern",
            "1": "Parkinson's-related voice pattern"
        }

        self.load_model()

    def load_model(self) -> None:
        """Loads joblib pipeline, feature columns, and deployment configuration."""
        if not self.pipeline_path.exists():
            raise FileNotFoundError(f"Model file not found at: {self.pipeline_path}")
        if not self.columns_path.exists():
            raise FileNotFoundError(f"Feature columns file not found at: {self.columns_path}")

        # 1. Load joblib pipeline
        self.pipeline = joblib.load(self.pipeline_path)

        # 2. Load feature column list
        with open(self.columns_path, "r", encoding="utf-8") as f:
            self.feature_columns = json.load(f)

        # 3. Load configuration if present
        if self.config_path.exists():
            with open(self.config_path, "r", encoding="utf-8") as f:
                self.config = json.load(f)
                self.decision_threshold = float(self.config.get("decision_threshold", 0.50))
                if "class_mapping" in self.config:
                    self.class_mapping = self.config["class_mapping"]

        # 4. Verify pipeline feature dimension
        expected_dim = len(self.feature_columns)
        first_step = self.pipeline.steps[0][1]
        n_in = getattr(first_step, "n_features_in_", None)
        if n_in is not None and n_in != expected_dim:
            raise ValueError(
                f"Pipeline expects {n_in} input features, but {expected_dim} columns are configured."
            )

    @property
    def feature_count(self) -> int:
        return len(self.feature_columns)

    def predict(self, feature_vector: np.ndarray) -> Dict[str, Any]:
        """
        Executes inference using loaded joblib pipeline and applies frozen threshold.

        Args:
            feature_vector: 2D array of shape (1, 100).

        Returns:
            Dict[str, Any]: Classification result with probabilities and confidence.
        """
        if self.pipeline is None:
            raise RuntimeError("Model pipeline is not loaded.")

        if feature_vector.ndim != 2 or feature_vector.shape[1] != len(self.feature_columns):
            raise ValueError(
                f"Invalid feature shape: expected (1, {len(self.feature_columns)}), "
                f"got {feature_vector.shape}."
            )

        # Obtain class probabilities from calibrated Logistic Regression stage
        # Classes: 0 = Healthy Control (HC), 1 = Parkinson's Disease (PD)
        probabilities = self.pipeline.predict_proba(feature_vector)[0]
        prob_hc = float(probabilities[0])
        prob_pd = float(probabilities[1])

        # Apply frozen decision threshold (default 0.50 from Dev OOF calibration)
        predicted_class = 1 if prob_pd >= self.decision_threshold else 0
        class_label = self.class_mapping.get(str(predicted_class), "Unknown")
        confidence = round(prob_pd if predicted_class == 1 else prob_hc, 4)

        return {
            "success": True,
            "predicted_class": predicted_class,
            "prediction_label": class_label,
            "probability_parkinsons": round(prob_pd, 4),
            "probability_healthy": round(prob_hc, 4),
            "confidence": confidence,
            "decision_threshold_applied": self.decision_threshold,
            "feature_count_used": len(self.feature_columns),
            "message": "Voice sample classified successfully (research prototype - not a clinical diagnosis).",
            "disclaimer": self.config.get(
                "disclaimer",
                "Educational and research prototype only. Not a clinical diagnostic system. "
                "Clinical diagnosis requires comprehensive neurological evaluation by licensed medical professionals."
            )
        }
