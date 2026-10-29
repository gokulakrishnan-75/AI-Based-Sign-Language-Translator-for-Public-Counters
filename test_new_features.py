import numpy as np

def compute_features(pts):
    pts = np.array(pts, dtype=np.float32)
    if pts.shape == (63,):
        pts = pts.reshape((21, 3))
    
    # 1. Wrist translation
    wrist = pts[0].copy()
    translated = pts - wrist
    
    # 2. Canonical handedness alignment (Pinky always on right +X, Index on left -X)
    if translated[17, 0] < translated[5, 0]:
        translated[:, 0] = -translated[:, 0]
        
    # 3. Scale normalization by palm size (wrist to middle MCP)
    palm_size = np.linalg.norm(translated[9])
    if palm_size < 1e-4:
        palm_size = np.max(np.linalg.norm(translated, axis=1)) + 1e-5
    normalized = translated / palm_size
    
    # 4. Finger curl ratios: tip distance to wrist vs mcp distance to wrist
    tip_indices = [4, 8, 12, 16, 20]
    mcp_indices = [2, 5, 9, 13, 17]
    curls = []
    for tip, mcp in zip(tip_indices, mcp_indices):
        tip_d = np.linalg.norm(normalized[tip])
        mcp_d = np.linalg.norm(normalized[mcp])
        curls.append(tip_d / (mcp_d + 1e-5))
        
    # 5. Consecutive spreads
    spreads = []
    for i in range(len(tip_indices) - 1):
        dist = np.linalg.norm(normalized[tip_indices[i]] - normalized[tip_indices[i+1]])
        spreads.append(dist)
        
    # 6. Global spreads
    thumb_pinky = np.linalg.norm(normalized[4] - normalized[20])
    thumb_index = np.linalg.norm(normalized[4] - normalized[8])
    thumb_middle = np.linalg.norm(normalized[4] - normalized[12])
    
    # 7. Finger bend angles: cos(angle) between (MCP - wrist) and (TIP - MCP)
    bends = []
    for tip, mcp in zip(tip_indices, mcp_indices):
        v1 = normalized[mcp] # from wrist to mcp
        v2 = normalized[tip] - normalized[mcp] # from mcp to tip
        n1 = np.linalg.norm(v1)
        n2 = np.linalg.norm(v2)
        if n1 > 1e-4 and n2 > 1e-4:
            cos_theta = np.dot(v1, v2) / (n1 * n2)
        else:
            cos_theta = 0.0
        bends.append(np.clip(cos_theta, -1.0, 1.0))
        
    feats = np.concatenate([
        normalized.flatten(),       # 63
        np.array(curls, np.float32),# 5
        np.array(spreads, np.float32), # 4
        np.array([thumb_pinky, thumb_index, thumb_middle], np.float32), # 3
        np.array(bends, np.float32) # 5
    ])
    return feats

if __name__ == '__main__':
    import os
    import sys
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, "signbridge-ai") if os.path.isdir(os.path.join(script_dir, "signbridge-ai")) else script_dir
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    from ml.dataset.dataset_builder import get_base_neutral_hand
    h = get_base_neutral_hand()
    f = compute_features(h)
    print("Feature dimension:", len(f))
    print("Curls:", [round(x, 2) for x in f[63:68]])
    print("Spreads:", [round(x, 2) for x in f[68:72]])
    print("Thumb-Pinky/Index/Middle:", [round(x, 2) for x in f[72:75]])
    print("Bends (cos):", [round(x, 2) for x in f[75:80]])
