"""
SIGNBRIDGE AI - Real-Time Landmark Classifier Service
Loads the trained deep neural network model and performs high-speed inference on hand landmark inputs.
"""

import os
import sys
import time
import joblib
import numpy as np

# Ensure path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, "../.."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml.preprocessing.features import normalize_landmarks
from backend.services.signs_data import SUPPORTED_SIGNS, CLASS_TO_SIGN

MODEL_PATH = os.path.join(project_root, "ml", "exported_models", "sign_classifier.joblib")

class SignClassifier:
    def __init__(self, model_path=MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.is_loaded = False
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.is_loaded = True
                print(f"[SignClassifier] Successfully loaded model from {self.model_path}")
            except Exception as e:
                print(f"[SignClassifier] Error loading model: {e}")
                self.is_loaded = False
        else:
            print(f"[SignClassifier] Model file not found at {self.model_path}")
            self.is_loaded = False

    def predict(self, landmarks):
        """
        Runs inference on 21 3D landmarks.
        Returns dict with:
        - raw_sign: top sign name
        - confidence: float 0-100
        - class_id: int
        - latency_ms: float
        - probabilities: dict of sign_name -> percentage
        """
        if not self.is_loaded or self.model is None:
            return {
                "error": "Model not loaded",
                "sign": "UNKNOWN",
                "confidence": 0.0,
                "latency_ms": 0.0
            }

        t0 = time.perf_counter()
        
        # 1. Feature normalization
        features = normalize_landmarks(landmarks)
        features = features.reshape(1, -1)

        # 2. Model inference
        probabilities = self.model.predict_proba(features)[0]
        t1 = time.perf_counter()
        latency_ms = round((t1 - t0) * 1000, 2)

        top_class_id = int(np.argmax(probabilities))
        top_confidence = round(float(probabilities[top_class_id]) * 100, 1)
        sign_name = CLASS_TO_SIGN.get(top_class_id, "UNKNOWN")

        prob_dict = {
            CLASS_TO_SIGN.get(i, f"Class {i}"): round(float(p) * 100, 1)
            for i, p in enumerate(probabilities)
        }

        return {
            "sign": sign_name,
            "class_id": top_class_id,
            "confidence": top_confidence,
            "latency_ms": latency_ms,
            "probabilities": prob_dict
        }

# Global singleton
_classifier_instance = None

def get_classifier():
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = SignClassifier()
    return _classifier_instance
