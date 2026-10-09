import sys
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report
from test_separator2 import generate_canonical, get_base_neutral_hand, curl_finger_tight, curl_thumb_tuck, extend_finger_straight, signs
from test_separator import compute_features

# Refined canonical generator with maximum separation:
def get_refined_canonical(sign_id):
    hand = get_base_neutral_hand()
    if sign_id == "hello":
        extend_finger_straight(hand, 5, np.array([0.38, 0.24, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.20, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.62, 0.24, 0.02]))
        extend_finger_straight(hand, 17, np.array([0.74, 0.32, 0.04]))
        hand[4] = [0.24, 0.50, -0.08]
    elif sign_id == "thank_you":
        extend_finger_straight(hand, 5, np.array([0.45, 0.38, 0.14]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.36, 0.16]))
        extend_finger_straight(hand, 13, np.array([0.55, 0.38, 0.14]))
        extend_finger_straight(hand, 17, np.array([0.60, 0.42, 0.12]))
        hand[4] = [0.38, 0.52, 0.08]
    elif sign_id == "yes":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        hand[1] = [0.44, 0.78, -0.02]
        hand[2] = [0.42, 0.68, -0.05]
        hand[3] = [0.41, 0.54, -0.08]
        hand[4] = [0.40, 0.40, -0.10] # Thumb straight UP
    elif sign_id == "no":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        extend_finger_straight(hand, 5, np.array([0.48, 0.44, 0.08]))
        extend_finger_straight(hand, 9, np.array([0.52, 0.44, 0.08]))
        hand[2] = [0.44, 0.66, -0.02]
        hand[3] = [0.48, 0.55, 0.02]
        hand[4] = [0.50, 0.48, 0.06]
    elif sign_id == "help":
        # Open asking palm reaching upward
        extend_finger_straight(hand, 5, np.array([0.44, 0.46, -0.14]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.44, -0.15]))
        extend_finger_straight(hand, 13, np.array([0.56, 0.46, -0.14]))
        extend_finger_straight(hand, 17, np.array([0.62, 0.50, -0.13]))
        hand[4] = [0.32, 0.60, -0.10]
    elif sign_id == "water":
        extend_finger_straight(hand, 5, np.array([0.41, 0.25, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.22, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.59, 0.25, 0.01]))
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.2)
        hand[4] = hand[20] + np.array([-0.02, 0, 0.01])
    elif sign_id == "please":
        extend_finger_straight(hand, 5, np.array([0.26, 0.54, -0.02]))
        extend_finger_straight(hand, 9, np.array([0.26, 0.58, 0.00]))
        extend_finger_straight(hand, 13, np.array([0.27, 0.62, 0.02]))
        extend_finger_straight(hand, 17, np.array([0.29, 0.66, 0.03]))
        hand[4] = [0.34, 0.70, -0.02]
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
        extend_finger_straight(hand, 5, np.array([0.46, 0.20, -0.05]))
    elif sign_id == "hospital":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 5, np.array([0.72, 0.55, -0.03]))
        extend_finger_straight(hand, 9, np.array([0.72, 0.60, -0.01]))
    elif sign_id == "bank":
        # 'B' handshape: 4 fingers upright together, thumb folded flat across palm
        extend_finger_straight(hand, 5, np.array([0.46, 0.25, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.23, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.54, 0.25, 0.01]))
        extend_finger_straight(hand, 17, np.array([0.58, 0.29, 0.03]))
        hand[4] = [0.48, 0.68, 0.02]
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
        extend_finger_straight(hand, 5, np.array([0.46, 0.20, -0.05]))
        hand[2] = [0.40, 0.70, -0.03]
        hand[3] = [0.32, 0.65, -0.05]
        hand[4] = [0.18, 0.64, -0.07]
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

# Augment helper:
def augment(pts, rng):
    pts = pts.copy()
    if rng.rand() > 0.5:
        wrist_x = pts[0, 0]
        pts[:, 0] = wrist_x - (pts[:, 0] - wrist_x)
    scale = rng.uniform(0.85, 1.15)
    center = pts[9]
    pts = center + (pts - center) * scale
    angle_rad = np.radians(rng.uniform(-18.0, 18.0))
    cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)
    R2 = np.array([[cos_a, -sin_a], [sin_a, cos_a]])
    xy = pts[:, :2] - center[:2]
    pts[:, :2] = center[:2] + np.dot(xy, R2.T)
    tx, ty, tz = rng.uniform(-0.05, 0.05, 3)
    pts += np.array([tx, ty, tz])
    pts += rng.normal(0.0, 0.006, size=pts.shape)
    return pts

rng = np.random.RandomState(42)
X_train, y_train = [], []
X_test, y_test = [], []

for idx, s in enumerate(signs):
    can = get_refined_canonical(s)
    # 100 train, 20 test
    for _ in range(100):
        aug = augment(can, rng)
        X_train.append(compute_features(aug))
        y_train.append(idx)
    for _ in range(20):
        aug = augment(can, rng)
        X_test.append(compute_features(aug))
        y_test.append(idx)

X_train = np.array(X_train, dtype=np.float32)
y_train = np.array(y_train, dtype=np.int32)
X_test = np.array(X_test, dtype=np.float32)
y_test = np.array(y_test, dtype=np.int32)

print(f"Dataset generated: Train {X_train.shape}, Test {X_test.shape}")
clf = MLPClassifier(hidden_layer_sizes=(128, 64, 32), max_iter=200, random_state=42, early_stopping=True)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Test Accuracy: {acc*100:.2f}%")

# Test canonical signs directly
passed = 0
for idx, s in enumerate(signs):
    can = get_refined_canonical(s)
    f = compute_features(can)
    p = clf.predict([f])[0]
    prob = clf.predict_proba([f])[0][p] * 100
    if p == idx:
        passed += 1
    else:
        print(f"MISMATCH: {s} expected {idx}, got {signs[p]} ({prob:.1f}%)")

print(f"Canonical direct test: {passed}/{len(signs)} PASSED!")
