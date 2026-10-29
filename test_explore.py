import os
import sys
import json
import joblib
import numpy as np

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.join(script_dir, "signbridge-ai") if os.path.isdir(os.path.join(script_dir, "signbridge-ai")) else script_dir
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml.preprocessing.features import normalize_landmarks

model = joblib.load(os.path.join(project_root, "ml", "exported_models", "sign_classifier.joblib"))
with open(os.path.join(project_root, "ml", "dataset", "dataset_summary.json"), "r", encoding="utf-8") as f:
    classes = json.load(f)["classes"]

# Let's simulate a hand like the user in the image:
# Wrist at bottom: [0.5, 0.85, 0]
# Palm center (MCP 9): [0.5, 0.55, 0]
# Tips extended upwards:
# Thumb: [0.35, 0.55, 0]
# Index: [0.42, 0.25, 0]
# Middle: [0.50, 0.20, 0]
# Ring: [0.58, 0.25, 0]
# Pinky: [0.65, 0.35, 0]

# Let's test a realistic hand detected by MediaPipe:
def make_hand(wrist=(0.5, 0.8), palm_rot=0.0, finger_curl=[1,1,1,1,1], thumb_spread=0.15):
    # MediaPipe 21 landmarks
    # 0: wrist
    # 1-4: thumb
    # 5-8: index
    # 9-12: middle
    # 13-16: ring
    # 17-20: pinky
    pts = np.zeros((21, 3), dtype=np.float32)
    pts[0] = [wrist[0], wrist[1], 0]
    
    # MCPs
    pts[1] = [wrist[0] - 0.05, wrist[1] - 0.07, -0.01]
    pts[2] = [wrist[0] - 0.09, wrist[1] - 0.14, -0.02]
    pts[5] = [wrist[0] - 0.06, wrist[1] - 0.25, -0.01]
    pts[9] = [wrist[0], wrist[1] - 0.27, 0]
    pts[13] = [wrist[0] + 0.06, wrist[1] - 0.25, 0.01]
    pts[17] = [wrist[0] + 0.11, wrist[1] - 0.20, 0.02]
    
    # Thumb
    pts[3] = pts[2] + [-thumb_spread * 0.5, -0.07, -0.02]
    pts[4] = pts[3] + [-thumb_spread * 0.5, -0.06, -0.02]
    
    # Fingers with curl factor (1.0 = fully open, 0.2 = curled)
    for base_idx, mcp_idx, dx in [(5, 5, -0.06), (9, 9, 0), (13, 13, 0.06), (17, 17, 0.11)]:
        c = finger_curl[(base_idx-5)//4 + 1] # curl factor
        pip = pts[mcp_idx] + [dx * 0.2, -0.12 * c, -0.01]
        dip = pip + [dx * 0.1, -0.10 * c, -0.01]
        tip = dip + [dx * 0.1, -0.09 * c, -0.01]
        pts[mcp_idx + 1] = pip
        pts[mcp_idx + 2] = dip
        pts[mcp_idx + 3] = tip

    return pts

hand_open = make_hand(finger_curl=[1, 1, 1, 1, 1])
feats = normalize_landmarks(hand_open)
proba = model.predict_proba([feats])[0]
top = np.argsort(proba)[::-1][:5]
print("Custom open hand prediction:")
for idx in top:
    print(f"  {classes[idx]}: {proba[idx]*100:.2f}%")
