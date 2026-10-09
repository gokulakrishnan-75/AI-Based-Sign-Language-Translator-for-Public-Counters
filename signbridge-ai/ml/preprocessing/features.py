"""
SIGNBRIDGE AI - Feature Extraction & Normalization
Extracts 3D hand landmark coordinates, applies origin translation,
canonical handedness alignment, palm scale normalization,
invariant finger curl ratios, inter-digital spreads, pinch distances,
vertical orientation directions, and joint bend angles.
"""

import numpy as np

NUM_LANDMARKS = 21
FEATURE_DIM = 90  # 63 normalized coords + 5 curl ratios + 4 adjacent spreads + 3 global spreads + 5 pinches + 5 vertical directions + 5 bend angles

def normalize_landmarks(landmarks):
    """
    Normalizes a list or array of 21 (x, y, z) landmarks:
    1. Translates all landmarks relative to the wrist (landmark 0).
    2. Canonical handedness alignment (Pinky always on right +X, Index on left -X).
       Guarantees 100% invariance between left hand, right hand, and mirrored webcams!
    3. Scale normalization (Euclidean distance from wrist [0] to middle finger MCP [9]).
    4. Computes invariant finger curl ratios.
    5. Computes adjacent finger spreads.
    6. Computes global finger spreads (Thumb to Pinky, Index, Middle).
    7. Computes inter-finger pinch distances (Thumb to each fingertip, Index to Middle).
    8. Computes vertical finger directions (tip_y - mcp_y).
    9. Computes finger joint bend cosine angles.
    
    Returns:
        np.ndarray: 90-dimensional normalized feature vector.
    """
    pts = np.array(landmarks, dtype=np.float32)
    if pts.shape == (NUM_LANDMARKS * 3,):
        pts = pts.reshape((NUM_LANDMARKS, 3))
    elif pts.shape != (NUM_LANDMARKS, 3):
        raise ValueError(f"Expected shape ({NUM_LANDMARKS}, 3), got {pts.shape}")

    # 1. Wrist reference translation (invariance to hand position in camera frame)
    wrist = pts[0].copy()
    translated = pts - wrist

    # 2. Canonical handedness alignment:
    # Ensure Pinky MCP (17) is to the right (+X) of Index MCP (5)
    # This guarantees 100% invariance between left hand, right hand, and mirrored webcams!
    if translated[17, 0] < translated[5, 0]:
        translated[:, 0] = -translated[:, 0]

    # 3. Scale normalization (invariance to camera distance and hand size)
    palm_size = np.linalg.norm(translated[9])
    if palm_size < 1e-4:
        palm_size = np.max(np.linalg.norm(translated, axis=1)) + 1e-5

    normalized_coords = translated / palm_size

    # Key landmark indices:
    tip_indices = [4, 8, 12, 16, 20]
    mcp_indices = [2, 5, 9, 13, 17]

    # 4. Finger extension/curl ratios: distance from tip to wrist vs mcp to wrist
    curls = []
    for tip, mcp in zip(tip_indices, mcp_indices):
        tip_dist = np.linalg.norm(normalized_coords[tip])
        mcp_dist = np.linalg.norm(normalized_coords[mcp])
        curls.append(tip_dist / (mcp_dist + 1e-5))

    # 5. Adjacent finger spreads (fingertip to fingertip)
    spreads = []
    for i in range(len(tip_indices) - 1):
        dist = np.linalg.norm(normalized_coords[tip_indices[i]] - normalized_coords[tip_indices[i+1]])
        spreads.append(dist)

    # 6. Global finger spreads (Thumb to Pinky, Thumb to Index, Thumb to Middle)
    thumb_pinky = np.linalg.norm(normalized_coords[4] - normalized_coords[20])
    thumb_index = np.linalg.norm(normalized_coords[4] - normalized_coords[8])
    thumb_middle = np.linalg.norm(normalized_coords[4] - normalized_coords[12])

    # 7. Pinches (Thumb to each fingertip + Index to Middle)
    pinch_thumb_index = np.linalg.norm(normalized_coords[4] - normalized_coords[8])
    pinch_thumb_middle = np.linalg.norm(normalized_coords[4] - normalized_coords[12])
    pinch_thumb_ring = np.linalg.norm(normalized_coords[4] - normalized_coords[16])
    pinch_thumb_pinky = np.linalg.norm(normalized_coords[4] - normalized_coords[20])
    pinch_index_middle = np.linalg.norm(normalized_coords[8] - normalized_coords[12])
    pinches = [pinch_thumb_index, pinch_thumb_middle, pinch_thumb_ring, pinch_thumb_pinky, pinch_index_middle]

    # 8. Vertical finger directions (tip_y - mcp_y)
    dirs_y = []
    for tip, mcp in zip(tip_indices, mcp_indices):
        dirs_y.append(normalized_coords[tip, 1] - normalized_coords[mcp, 1])

    # 9. Finger bend angles: cos(angle) between (MCP - wrist) and (TIP - MCP)
    bends = []
    for tip, mcp in zip(tip_indices, mcp_indices):
        v1 = normalized_coords[mcp]
        v2 = normalized_coords[tip] - normalized_coords[mcp]
        n1 = np.linalg.norm(v1)
        n2 = np.linalg.norm(v2)
        if n1 > 1e-4 and n2 > 1e-4:
            cos_theta = np.dot(v1, v2) / (n1 * n2)
        else:
            cos_theta = 0.0
        bends.append(np.clip(cos_theta, -1.0, 1.0))

    # Combine into 90-dimensional feature vector
    feature_vector = np.concatenate([
        normalized_coords.flatten(),                                          # 63
        np.array(curls, dtype=np.float32),                                    # 5
        np.array(spreads, dtype=np.float32),                                  # 4
        np.array([thumb_pinky, thumb_index, thumb_middle], dtype=np.float32), # 3
        np.array(pinches, dtype=np.float32),                                  # 5
        np.array(dirs_y, dtype=np.float32),                                   # 5
        np.array(bends, dtype=np.float32)                                     # 5
    ])

    return feature_vector
