import sys
sys.path.insert(0, 'signbridge-ai')
import numpy as np
from ml.dataset.dataset_builder import generate_canonical_sign_landmarks
from backend.services.signs_data import SUPPORTED_SIGNS

def inspect():
    for sign in SUPPORTED_SIGNS:
        s_id = sign['id']
        name = sign['name']
        hand = generate_canonical_sign_landmarks(s_id)
        # Check curl: dist from wrist to tip vs wrist to mcp
        wrist = hand[0]
        curls = []
        for tip_idx, mcp_idx in [(4,2), (8,5), (12,9), (16,13), (20,17)]:
            tip_d = np.linalg.norm(hand[tip_idx] - wrist)
            mcp_d = np.linalg.norm(hand[mcp_idx] - wrist)
            curls.append(round(tip_d / mcp_d, 2))
        
        # open = curl > 1.4, curled = curl < 1.1
        state = []
        names = ['T', 'I', 'M', 'R', 'P']
        for n, c in zip(names, curls):
            state.append(f"{n}:{'OPEN' if c > 1.4 else ('CURL' if c < 1.1 else 'MID')}({c})")
        print(f"{name:15} | {' '.join(state)}")

if __name__ == '__main__':
    inspect()
