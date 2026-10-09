"""
SIGNBRIDGE AI - FastAPI Backend Application
Provides real-time landmark classification, prediction stabilization,
dataset studio capture, retraining, analytics, and public service counter endpoints.
"""

import os
import sys
import json
import time
import threading
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Path resolution
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.services.signs_data import SUPPORTED_SIGNS, CLASS_TO_SIGN, SIGN_TO_CLASS, ID_TO_SIGN
from backend.recognition.classifier import get_classifier
from backend.recognition.stabilizer import PredictionStabilizer
from backend.translation.sentence_builder import SentenceBuilder
from ml.training.train import train_and_evaluate

app = FastAPI(
    title="SIGNBRIDGE AI API",
    description="Real-time Sign Language Translation API for Public Service Counters",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory services
classifier = get_classifier()
stabilizer = PredictionStabilizer()
sentence_builder = SentenceBuilder()

# Session memory for public counter
counter_sessions = [
    {
        "id": "demo-sess-1",
        "timestamp": "10:14 AM",
        "counter": "Counter 04 (Reception & Token Desk)",
        "citizen_text": "HELLO I NEED HELP WHERE RESTROOM",
        "spoken_text": "Hello, I need assistance please. Where is the restroom located?",
        "staff_response": "The accessible restroom is straight down Corridor B on your right side.",
        "confidence": 94.6,
        "status": "Resolved"
    },
    {
        "id": "demo-sess-2",
        "timestamp": "10:28 AM",
        "counter": "Counter 02 (Railway & Transport Pass)",
        "citizen_text": "TICKET RAILWAY PLEASE",
        "spoken_text": "I would like to inquire about a railway ticket please.",
        "staff_response": "Platform 3 express tickets are available at kiosk 1 or here.",
        "confidence": 96.1,
        "status": "Resolved"
    }
]

# Request / Response Schemas
def parse_landmarks_payload(raw_landmarks):
    if not raw_landmarks or len(raw_landmarks) != 21:
        return None
    parsed = []
    for p in raw_landmarks:
        if isinstance(p, dict):
            parsed.append([float(p.get("x", 0.0)), float(p.get("y", 0.0)), float(p.get("z", 0.0))])
        elif isinstance(p, (list, tuple)):
            parsed.append([float(p[0]), float(p[1]), float(p[2]) if len(p) > 2 else 0.0])
        else:
            return None
    return parsed

class LandmarkPredictRequest(BaseModel):
    landmarks: List[Any]

class StabilizeRequest(BaseModel):
    landmarks: Optional[List[Any]] = None

class CaptureSampleRequest(BaseModel):
    sign_id: str
    landmarks: List[Any]

class CounterMessageRequest(BaseModel):
    counter: str
    citizen_text: str
    spoken_text: str
    staff_response: Optional[str] = ""
    confidence: float

# Routes
@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "service": "SIGNBRIDGE AI Platform",
        "model_loaded": classifier.is_loaded,
        "supported_signs_count": len(SUPPORTED_SIGNS),
        "timestamp": time.time()
    }

@app.get("/api/signs")
def get_signs():
    return {
        "total": len(SUPPORTED_SIGNS),
        "signs": SUPPORTED_SIGNS
    }

@app.post("/api/predict")
def predict_landmarks(req: LandmarkPredictRequest):
    pts = parse_landmarks_payload(req.landmarks)
    if pts is None or len(pts) != 21:
        raise HTTPException(status_code=400, detail="Must provide exactly 21 hand landmarks.")
    
    result = classifier.predict(pts)
    return result

@app.post("/api/predict/stabilize")
def predict_and_stabilize(req: StabilizeRequest):
    pts = parse_landmarks_payload(req.landmarks)
    if pts is None or len(pts) != 21:
        return stabilizer.process_frame(None)
    
    raw_pred = classifier.predict(pts)
    stabilized = stabilizer.process_frame(raw_pred)
    stabilized["probabilities"] = raw_pred.get("probabilities", {})
    stabilized["latency_ms"] = raw_pred.get("latency_ms", 0.0)
    return stabilized

@app.post("/api/sentence/add")
def add_to_sentence(sign: str):
    new_sent = sentence_builder.add_token(sign)
    return {
        "sentence": new_sent,
        "tokens": sentence_builder.get_tokens(),
        "spoken_text": sentence_builder.get_spoken_text()
    }

@app.post("/api/sentence/undo")
def undo_sentence():
    new_sent = sentence_builder.undo()
    return {
        "sentence": new_sent,
        "tokens": sentence_builder.get_tokens(),
        "spoken_text": sentence_builder.get_spoken_text()
    }

@app.post("/api/sentence/clear")
def clear_sentence():
    sentence_builder.clear()
    stabilizer.reset()
    return {
        "sentence": "",
        "tokens": [],
        "spoken_text": ""
    }

@app.get("/api/metrics")
def get_metrics():
    metrics_path = os.path.join(project_root, "ml", "evaluation", "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "status": "pending",
        "message": "Model evaluation pending. Run training pipeline to view real metrics."
    }

@app.post("/api/dataset/capture")
def capture_sample(req: CaptureSampleRequest):
    if req.sign_id not in ID_TO_SIGN:
        raise HTTPException(status_code=400, detail=f"Unknown sign id: {req.sign_id}")
    if len(req.landmarks) != 21:
        raise HTTPException(status_code=400, detail="Must provide exactly 21 landmarks")

    train_class_dir = os.path.join(project_root, "ml", "dataset", "train", req.sign_id)
    os.makedirs(train_class_dir, exist_ok=True)

    timestamp_str = int(time.time() * 1000)
    fname = f"captured_{timestamp_str}.json"
    fpath = os.path.join(train_class_dir, fname)

    sign_info = ID_TO_SIGN[req.sign_id]
    sample_data = {
        "sign_id": req.sign_id,
        "sign_name": sign_info["name"],
        "class_id": sign_info["class_id"],
        "source": "Dataset Studio Capture",
        "timestamp": timestamp_str,
        "landmarks": req.landmarks
    }

    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(sample_data, f)

    # Count total samples for this class
    current_count = len([f for f in os.listdir(train_class_dir) if f.endswith(".json")])
    return {
        "success": True,
        "sign_id": req.sign_id,
        "sign_name": sign_info["name"],
        "sample_file": fname,
        "class_sample_count": current_count
    }

@app.get("/api/dataset/stats")
def get_dataset_stats():
    dataset_base = os.path.join(project_root, "ml", "dataset")
    stats = []
    
    for sign in SUPPORTED_SIGNS:
        s_id = sign["id"]
        train_cnt = 0
        val_cnt = 0
        test_cnt = 0
        
        t_dir = os.path.join(dataset_base, "train", s_id)
        if os.path.isdir(t_dir):
            train_cnt = len([f for f in os.listdir(t_dir) if f.endswith(".json")])
            
        v_dir = os.path.join(dataset_base, "val", s_id)
        if os.path.isdir(v_dir):
            val_cnt = len([f for f in os.listdir(v_dir) if f.endswith(".json")])
            
        te_dir = os.path.join(dataset_base, "test", s_id)
        if os.path.isdir(te_dir):
            test_cnt = len([f for f in os.listdir(te_dir) if f.endswith(".json")])
            
        stats.append({
            "id": s_id,
            "name": sign["name"],
            "category": sign["category"],
            "train": train_cnt,
            "val": val_cnt,
            "test": test_cnt,
            "total": train_cnt + val_cnt + test_cnt
        })

    return {
        "total_signs": len(SUPPORTED_SIGNS),
        "total_samples": sum(s["total"] for s in stats),
        "classes": stats
    }

def background_retrain_task():
    global classifier
    print("[Retrain Task] Starting background training on updated dataset...")
    metrics = train_and_evaluate(
        dataset_dir=os.path.join(project_root, "ml", "dataset"),
        models_dir=os.path.join(project_root, "ml", "exported_models"),
        eval_dir=os.path.join(project_root, "ml", "evaluation")
    )
    # Reload classifier in memory
    classifier = get_classifier()
    classifier.load_model()
    print("[Retrain Task] Model retrained and reloaded successfully.")

@app.post("/api/dataset/retrain")
def retrain_model(background_tasks: BackgroundTasks):
    background_tasks.add_task(background_retrain_task)
    return {
        "status": "training_started",
        "message": "Model retraining initiated in background. Active model will hot-reload upon completion."
    }

@app.get("/api/counter/history")
def get_counter_history():
    return {
        "sessions": counter_sessions
    }

@app.post("/api/counter/message")
def save_counter_message(msg: CounterMessageRequest):
    new_sess = {
        "id": f"sess-{int(time.time())}",
        "timestamp": time.strftime("%I:%M %p"),
        "counter": msg.counter,
        "citizen_text": msg.citizen_text,
        "spoken_text": msg.spoken_text,
        "staff_response": msg.staff_response,
        "confidence": msg.confidence,
        "status": "Active"
    }
    counter_sessions.insert(0, new_sess)
    return {"success": True, "session": new_sess}
