import sys
sys.path.insert(0, 'signbridge-ai')
import joblib, json, numpy as np
from ml.preprocessing.features import normalize_landmarks
from ml.dataset.dataset_builder import generate_canonical_sign_landmarks, augment_landmarks
from backend.services.signs_data import SUPPORTED_SIGNS

model = joblib.load('signbridge-ai/ml/exported_models/sign_classifier.joblib')
with open('signbridge-ai/ml/exported_models/model_weights.json') as f:
    classes = json.load(f)['classes']

rng = np.random.RandomState(999)

def test_signs():
    signs_to_test = [s['id'] for s in SUPPORTED_SIGNS]
    print(f"{'SIGN NAME':15} | {'EXPECTED':15} | {'PREDICTED':15} | {'CONFIDENCE':10} | {'STATUS'}")
    print("-" * 75)
    
    for s_id in signs_to_test:
        sign_info = next(s for s in SUPPORTED_SIGNS if s['id'] == s_id)
        expected = sign_info['name']
        canonical = generate_canonical_sign_landmarks(s_id)
        
        # Test 5 augmented variants including left/right hand
        correct = 0
        conf_sum = 0
        for _ in range(10):
            aug = augment_landmarks(canonical, rng)
            feats = normalize_landmarks(aug)
            probs = model.predict_proba([feats])[0]
            pred_idx = np.argmax(probs)
            pred_name = classes[pred_idx]
            if pred_name == expected:
                correct += 1
            conf_sum += probs[pred_idx]
        
        # Canonical directly
        feats = normalize_landmarks(canonical)
        probs = model.predict_proba([feats])[0]
        pred_idx = np.argmax(probs)
        pred_name = classes[pred_idx]
        conf = probs[pred_idx] * 100
        
        status = "PASSED" if correct >= 9 else "WARNING"
        print(f"{s_id:15} | {expected:15} | {pred_name:15} | {conf:9.1f}% | {status} ({correct}/10 aug)")

if __name__ == '__main__':
    test_signs()
