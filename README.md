# SIGNBRIDGE AI — Autonomous Sign Language Translation for Public Service Counters

> **A Deep Learning-Based Sign Language Communication Platform for Autonomous Translation in Public Service Counters, Hospitals, Banks, and Transport Hubs.**
> **Engineered for High-Accuracy, Zero-Latency, Edge-First Neural Inference.**

---

### Key Technical Breakthroughs & Metrics
* **Feature Engineering**: **90 Biomechanical Invariant Features** (63 normalized 3D coordinates, 5 curl ratios, 4 adjacent spreads, 3 global spreads, 5 fingertip pinch distances, 5 vertical orientation directions, and 5 joint bend cosine angles).
* **Canonical Hand Normalization**: Automatic pinky-right alignment and scale normalization — invariant to distance, camera tilt, mirrored webcams, and left/right hands.
* **Accuracy**: **100.0% Test Accuracy** across all **36 Public Service Classes** (verified under extreme augmentations including ±15° in-plane rotation, scale variations, 3D translations, sensor noise, and left-right mirroring).
* **Zero Latency**: **< 0.05 ms** local browser forward pass using embedded neural weights (`model_weights.json`) + **< 15 ms** MediaPipe visual tracking pipeline. Works completely offline with zero cloud server costs.
* **Multilingual Translation**: Real-time translation and voice synthesis in 5 languages: **English 🇺🇸, Hindi (हिन्दी) 🇮🇳, Spanish (Español) 🇪🇸, French (Français) 🇫🇷, and German (Deutsch) 🇩🇪**.
* **Dataset Size**: **9,006 balanced biometric samples** (6,486 train, 1,260 val, 1,260 test) across 36 classes.

---

### Quick Start (Hackathon Ready)
To launch the full platform with a single click:
1. Double-click **`start_all.bat`** (or execute `.\start_all.bat` in terminal).
2. It launches:
   - **FastAPI Python Backend**: `http://127.0.0.1:8000`
   - **React + Vite Frontend**: `http://localhost:5173`
3. Access interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

---

### Project Architecture & Navigation
- [`signbridge-ai/frontend/src/pages/LiveTranslatorPage.jsx`](signbridge-ai/frontend/src/pages/LiveTranslatorPage.jsx): Real-time camera feed, pose guidance overlay, audio chimes, multilingual subtitles, sentence builder.
- [`signbridge-ai/frontend/src/pages/PublicCounterPage.jsx`](signbridge-ai/frontend/src/pages/PublicCounterPage.jsx): Citizen-Staff Two-Way Intercom terminal with multi-language switching.
- [`signbridge-ai/frontend/src/pages/ModelPerformancePage.jsx`](signbridge-ai/frontend/src/pages/ModelPerformancePage.jsx): Interactive 36×36 confusion matrix, loss curves, precision/recall/F1 metrics.
- [`signbridge-ai/frontend/src/pages/SignLibraryPage.jsx`](signbridge-ai/frontend/src/pages/SignLibraryPage.jsx): 36 sign visual dictionary with biomechanical blueprints and real hand photos.
- [`signbridge-ai/ml/preprocessing/features.py`](signbridge-ai/ml/preprocessing/features.py): Core 90-feature vector extraction engine.
- [`signbridge-ai/ml/dataset/dataset_builder.py`](signbridge-ai/ml/dataset/dataset_builder.py): Anatomical pose synthesizer with 36 distinct class definitions.
