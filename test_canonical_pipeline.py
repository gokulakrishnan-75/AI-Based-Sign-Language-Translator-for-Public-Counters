import sys
sys.path.insert(0, 'signbridge-ai')
import numpy as np

def test_canonical():
    from ml.dataset.dataset_builder import get_base_neutral_hand
    hand = get_base_neutral_hand()
    wrist = hand[0]
    translated = hand - wrist
    
    print("Normal hand:")
    print("  Index MCP (5) x:", translated[5, 0])
    print("  Pinky MCP (17) x:", translated[17, 0])
    print("  Pinky > Index?:", translated[17, 0] > translated[5, 0])
    
    # Flipped (mirrored) hand
    hand_mirrored = hand.copy()
    hand_mirrored[:, 0] = 1.0 - hand_mirrored[:, 0]
    wrist_m = hand_mirrored[0]
    translated_m = hand_mirrored - wrist_m
    
    print("Mirrored hand before canonical:")
    print("  Index MCP (5) x:", translated_m[5, 0])
    print("  Pinky MCP (17) x:", translated_m[17, 0])
    print("  Pinky > Index?:", translated_m[17, 0] > translated_m[5, 0])
    
    # Apply canonical flip:
    if translated_m[17, 0] < translated_m[5, 0]:
        translated_m[:, 0] = -translated_m[:, 0]
        
    print("Mirrored hand after canonical:")
    print("  Index MCP (5) x:", translated_m[5, 0])
    print("  Pinky MCP (17) x:", translated_m[17, 0])
    print("  Exact match with normal hand X?:", np.allclose(translated[:, 0], translated_m[:, 0]))

if __name__ == '__main__':
    test_canonical()
