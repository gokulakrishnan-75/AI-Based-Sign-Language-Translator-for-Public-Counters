import numpy as np

def get_base_neutral_hand():
    return np.array([
        [0.50, 0.85, 0.00],  # 0: Wrist
        # Thumb
        [0.44, 0.78, -0.02], # 1: Thumb CMC
        [0.39, 0.70, -0.04], # 2: Thumb MCP
        [0.34, 0.63, -0.06], # 3: Thumb IP
        [0.30, 0.55, -0.08], # 4: Thumb Tip
        # Index
        [0.44, 0.60, -0.02], # 5: Index MCP
        [0.42, 0.48, -0.03], # 6: Index PIP
        [0.41, 0.39, -0.04], # 7: Index DIP
        [0.40, 0.30, -0.05], # 8: Index Tip
        # Middle
        [0.50, 0.58, 0.00],  # 9: Middle MCP
        [0.50, 0.45, -0.01], # 10: Middle PIP
        [0.50, 0.35, -0.02], # 11: Middle DIP
        [0.50, 0.25, -0.03], # 12: Middle Tip
        # Ring
        [0.56, 0.60, 0.02],  # 13: Ring MCP
        [0.57, 0.48, 0.02],  # 14: Ring PIP
        [0.58, 0.40, 0.02],  # 15: Ring DIP
        [0.59, 0.32, 0.02],  # 16: Ring Tip
        # Pinky
        [0.61, 0.65, 0.03],  # 17: Pinky MCP
        [0.64, 0.55, 0.04],  # 18: Pinky PIP
        [0.66, 0.48, 0.04],  # 19: Pinky DIP
        [0.68, 0.41, 0.04]   # 20: Pinky Tip
    ], dtype=np.float32)

def curl_finger_tight(hand, mcp_idx, curl_factor=1.0):
    mcp = hand[mcp_idx]
    hand[mcp_idx + 1] = mcp + np.array([0.0, 0.08 * curl_factor, 0.06 * curl_factor])
    hand[mcp_idx + 2] = mcp + np.array([0.0, 0.15 * curl_factor, 0.04 * curl_factor])
    hand[mcp_idx + 3] = mcp + np.array([0.0, 0.18 * curl_factor, 0.01 * curl_factor])

def curl_thumb_tuck(hand, tuck_factor=1.0):
    cmc = hand[1]
    target = hand[9] * 0.7 + hand[0] * 0.3
    hand[2] = cmc + (target - cmc) * 0.4 * tuck_factor
    hand[3] = cmc + (target - cmc) * 0.7 * tuck_factor
    hand[4] = cmc + (target - cmc) * 1.0 * tuck_factor + np.array([0, 0, 0.02])

def extend_finger_straight(hand, mcp_idx, tip_pos):
    mcp = hand[mcp_idx]
    vec = tip_pos - mcp
    hand[mcp_idx + 1] = mcp + vec * 0.38
    hand[mcp_idx + 2] = mcp + vec * 0.72
    hand[mcp_idx + 3] = tip_pos

def generate_canonical(sign_id):
    hand = get_base_neutral_hand()
    if sign_id == "hello":
        extend_finger_straight(hand, 5, np.array([0.38, 0.26, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.22, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.62, 0.26, 0.02]))
        extend_finger_straight(hand, 17, np.array([0.72, 0.34, 0.04]))
        hand[4] = [0.26, 0.52, -0.08]
    elif sign_id == "thank_you":
        wrist_x = hand[0, 0]
        hand[:, 0] = wrist_x - (hand[:, 0] - wrist_x)
        extend_finger_straight(hand, 5, np.array([0.55, 0.40, 0.12]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.38, 0.14]))
        extend_finger_straight(hand, 13, np.array([0.45, 0.40, 0.12]))
        extend_finger_straight(hand, 17, np.array([0.40, 0.44, 0.10]))
        hand[4] = [0.62, 0.52, 0.08]
    elif sign_id == "yes":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        hand[1] = [0.44, 0.78, -0.02]
        hand[2] = [0.42, 0.68, -0.05]
        hand[3] = [0.41, 0.54, -0.08]
        hand[4] = [0.40, 0.42, -0.10]
    elif sign_id == "no":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        extend_finger_straight(hand, 5, np.array([0.48, 0.44, 0.08]))
        extend_finger_straight(hand, 9, np.array([0.52, 0.44, 0.08]))
        hand[2] = [0.44, 0.66, -0.02]
        hand[3] = [0.48, 0.55, 0.02]
        hand[4] = [0.50, 0.48, 0.06]
    elif sign_id == "help":
        for i in [5, 9, 13, 17]:
            curl_finger_tight(hand, i, 0.35)
        hand[4] = [0.32, 0.58, 0.04]
    elif sign_id == "water":
        extend_finger_straight(hand, 5, np.array([0.41, 0.25, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.22, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.59, 0.25, 0.01]))
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.2)
        hand[4] = hand[20] + np.array([-0.02, 0, 0.01])
    elif sign_id == "please":
        extend_finger_straight(hand, 5, np.array([0.28, 0.55, -0.02]))
        extend_finger_straight(hand, 9, np.array([0.28, 0.59, 0.00]))
        extend_finger_straight(hand, 13, np.array([0.29, 0.63, 0.02]))
        extend_finger_straight(hand, 17, np.array([0.31, 0.67, 0.03]))
        hand[4] = [0.36, 0.70, -0.02]
    elif sign_id == "wait":
        for i in [5, 9, 13, 17]:
            curl_finger_tight(hand, i, 0.55)
        hand[4] = [0.30, 0.62, 0.02]
    elif sign_id == "stop":
        extend_finger_straight(hand, 5, np.array([0.46, 0.25, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.23, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.54, 0.25, 0.01]))
        extend_finger_straight(hand, 17, np.array([0.58, 0.29, 0.03]))
        hand[4] = [0.42, 0.58, -0.04]
    elif sign_id == "where":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 5, np.array([0.46, 0.22, -0.05]))
    elif sign_id == "hospital":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 5, np.array([0.72, 0.55, -0.03]))
        extend_finger_straight(hand, 9, np.array([0.72, 0.60, -0.01]))
    elif sign_id == "bank":
        extend_finger_straight(hand, 5, np.array([0.38, 0.48, 0.08]))
        extend_finger_straight(hand, 9, np.array([0.48, 0.46, 0.08]))
        extend_finger_straight(hand, 13, np.array([0.58, 0.48, 0.08]))
        extend_finger_straight(hand, 17, np.array([0.66, 0.52, 0.08]))
        hand[4] = [0.24, 0.62, 0.04]
    elif sign_id == "railway":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 5, np.array([0.53, 0.26, -0.04]))
        extend_finger_straight(hand, 9, np.array([0.47, 0.25, -0.02]))
    elif sign_id == "emergency":
        hand[4] = [0.48, 0.62, 0.04]
        for i in [5, 9, 13, 17]:
            curl_finger_tight(hand, i, 1.1)
        hand[8] = [0.44, 0.59, 0.05]
        hand[12] = [0.47, 0.59, 0.05]
        hand[16] = [0.50, 0.60, 0.05]
        hand[20] = [0.53, 0.61, 0.05]
    elif sign_id == "doctor":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        extend_finger_straight(hand, 5, np.array([0.44, 0.23, -0.05]))
        d_ring = np.array([0.46, 0.52, 0.02])
        hand[4] = d_ring
        hand[12] = d_ring + [0.01, 0, 0]
    elif sign_id == "ticket":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.8)
        hand[6] = [0.44, 0.44, -0.03]
        hand[7] = [0.44, 0.42, 0.06]
        hand[8] = [0.44, 0.48, 0.08]
    elif sign_id == "money":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        pinch = np.array([0.46, 0.42, 0.02])
        hand[4] = pinch + [-0.01, 0.01, 0]
        hand[8] = pinch + [0.01, -0.01, 0]
        hand[12] = pinch + [0.00, -0.01, 0]
    elif sign_id == "restroom":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        hand[4] = [0.47, 0.50, -0.04]
    elif sign_id == "police":
        hand[4] = [0.36, 0.68, -0.02]
        extend_finger_straight(hand, 5, np.array([0.42, 0.42, 0.06]))
        extend_finger_straight(hand, 9, np.array([0.47, 0.40, 0.06]))
        extend_finger_straight(hand, 13, np.array([0.52, 0.42, 0.06]))
        extend_finger_straight(hand, 17, np.array([0.56, 0.46, 0.06]))
    elif sign_id == "food":
        p = np.array([0.48, 0.48, 0.06])
        hand[4] = p + [-0.015,  0.010,  0.00]
        hand[8] = p + [ 0.010, -0.015, -0.01]
        hand[12] = p + [ 0.000, -0.010,  0.01]
        hand[16] = p + [-0.010, -0.005,  0.01]
        hand[20] = p + [ 0.015,  0.010,  0.00]
        for mcp, tip in [(5,8), (9,12), (13,16), (17,20)]:
            hand[mcp+1] = hand[mcp] + (hand[tip] - hand[mcp])*0.4 + [0, 0.03, 0.04]
            hand[mcp+2] = hand[mcp] + (hand[tip] - hand[mcp])*0.75 + [0, 0.02, 0.03]
    elif sign_id == "goodbye":
        for i in [5, 9, 13, 17]:
            curl_finger_tight(hand, i, 0.70)
        hand[4] = [0.28, 0.58, -0.04]
    elif sign_id == "sorry":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        hand[4] = [0.40, 0.58, 0.02]
    elif sign_id == "name":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 5, np.array([0.42, 0.24, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.56, 0.24, -0.03]))
    elif sign_id == "id_card":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 17, np.array([0.65, 0.24, 0.03]))
    elif sign_id == "medicine":
        extend_finger_straight(hand, 5, np.array([0.42, 0.32, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.58, 0.32, 0.02]))
        extend_finger_straight(hand, 17, np.array([0.66, 0.38, 0.04]))
        curl_finger_tight(hand, 9, 1.3)
        hand[12] = [0.50, 0.56, 0.08]
    elif sign_id == "bus":
        for i in [5, 9, 13, 17]:
            curl_finger_tight(hand, i, 0.40)
        hand[4] = [0.32, 0.60, -0.04]
    elif sign_id == "time":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.8)
        extend_finger_straight(hand, 5, np.array([0.44, 0.72, 0.05]))
    elif sign_id == "pay":
        extend_finger_straight(hand, 5, np.array([0.42, 0.45, 0.12]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.42, 0.12]))
        extend_finger_straight(hand, 13, np.array([0.58, 0.45, 0.12]))
        extend_finger_straight(hand, 17, np.array([0.64, 0.50, 0.10]))
        hand[4] = [0.30, 0.55, 0.06]
    elif sign_id == "receipt":
        extend_finger_straight(hand, 9, np.array([0.54, 0.26, -0.02]))
        extend_finger_straight(hand, 13, np.array([0.62, 0.30, 0.01]))
        extend_finger_straight(hand, 17, np.array([0.70, 0.36, 0.03]))
        pinch = np.array([0.44, 0.48, 0.02])
        hand[4] = pinch + [-0.01, 0, 0]
        hand[8] = pinch + [0.01, 0, 0]
    elif sign_id == "form":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        extend_finger_straight(hand, 5, np.array([0.46, 0.22, -0.05]))
        hand[2] = [0.40, 0.70, -0.03]
        hand[3] = [0.32, 0.65, -0.05]
        hand[4] = [0.20, 0.64, -0.07]
    elif sign_id == "signature":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        pen = np.array([0.46, 0.50, 0.06])
        hand[4] = pen + [-0.01, 0.01, 0]
        hand[8] = pen + [0.01, -0.01, 0]
        hand[12] = pen + [0.01, 0.01, 0]
    elif sign_id == "call":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        hand[4] = [0.22, 0.50, -0.08]
        extend_finger_straight(hand, 17, np.array([0.76, 0.40, 0.05]))
    elif sign_id == "pain":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.9)
        extend_finger_straight(hand, 5, np.array([0.22, 0.55, -0.02]))
    elif sign_id == "wheelchair":
        for i in [5, 9, 13, 17]:
            curl_finger_tight(hand, i, 0.85)
        hand[4] = [0.38, 0.65, 0.04]
    elif sign_id == "deaf":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.8)
        extend_finger_straight(hand, 5, np.array([0.30, 0.30, -0.04]))
    elif sign_id == "train":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.8)
        extend_finger_straight(hand, 5, np.array([0.65, 0.50, 0.04]))
        extend_finger_straight(hand, 9, np.array([0.65, 0.56, 0.04]))
    return hand

import os
import sys
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)
from test_separator import compute_features

signs = [
    "hello", "thank_you", "yes", "no", "help", "water", "please", "wait",
    "stop", "where", "hospital", "bank", "railway", "emergency", "doctor",
    "ticket", "money", "restroom", "police", "food", "goodbye", "sorry",
    "name", "id_card", "medicine", "bus", "time", "pay", "receipt",
    "form", "signature", "call", "pain", "wheelchair", "deaf", "train"
]

feats = {s: compute_features(generate_canonical(s)) for s in signs}

too_close = []
for i in range(len(signs)):
    for j in range(i+1, len(signs)):
        s1, s2 = signs[i], signs[j]
        f1, f2 = feats[s1], feats[s2]
        dist = np.linalg.norm(f1 - f2)
        sim = np.dot(f1, f2) / (np.linalg.norm(f1) * np.linalg.norm(f2))
        if dist < 1.2 or sim > 0.95:
            too_close.append((s1, s2, round(dist, 3), round(sim, 4)))

print(f"Total checked: {len(signs)*(len(signs)-1)//2}")
print(f"Too close count: {len(too_close)}")
for s1, s2, d, s in sorted(too_close, key=lambda x: x[2]):
    print(f"  {s1:15} vs {s2:15} | dist: {d:6.3f} | cos sim: {s:.4f}")
