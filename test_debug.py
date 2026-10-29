import json
import os
import glob
import numpy as np

def check():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, "signbridge-ai") if os.path.isdir(os.path.join(script_dir, "signbridge-ai")) else script_dir
    classes_to_check = ['hello', 'food', 'stop', 'please', 'thank_you']
    for cls in classes_to_check:
        sample_file = os.path.join(project_root, 'ml', 'dataset', 'train', cls, 'sample_0000.json')
        if os.path.exists(sample_file):
            with open(sample_file) as f:
                d = json.load(f)
            pts = np.array(d['landmarks'])
            print(f"Class: {cls}")
            print(f"  Wrist: {pts[0]}")
            print(f"  Thumb tip (4): {pts[4]}")
            print(f"  Index tip (8): {pts[8]}")
            print(f"  Middle tip (12): {pts[12]}")
            print(f"  Ring tip (16): {pts[16]}")
            print(f"  Pinky tip (20): {pts[20]}")

if __name__ == '__main__':
    check()
