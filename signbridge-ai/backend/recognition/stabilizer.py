"""
SIGNBRIDGE AI - Multi-Layer Prediction Stabilizer & Temporal Filter
Implements sliding-window modal voting, confidence thresholding, streak confirmation,
duplicate debounce, and invalid gesture rejection to eliminate frame flickering.
"""

from collections import deque
import time

class PredictionStabilizer:
    def __init__(
        self,
        window_size=5,
        confidence_threshold=70.0,
        required_streak=3,
        cooldown_seconds=1.2
    ):
        self.window_size = window_size
        self.confidence_threshold = confidence_threshold
        self.required_streak = required_streak
        self.cooldown_seconds = cooldown_seconds

        self.history = deque(maxlen=window_size)
        self.last_emitted_sign = None
        self.last_emitted_time = 0
        self.current_streak_sign = None
        self.current_streak_count = 0

    def reset(self):
        self.history.clear()
        self.last_emitted_sign = None
        self.last_emitted_time = 0
        self.current_streak_sign = None
        self.current_streak_count = 0

    def process_frame(self, raw_prediction):
        """
        Processes a raw frame prediction dict:
        {
            "sign": "HELLO",
            "confidence": 94.6,
            "latency_ms": 1.2
        }

        Returns stabilized result:
        {
            "stabilized_sign": "HELLO" or None,
            "raw_sign": "HELLO",
            "confidence": 94.6,
            "status": "High Confidence" | "Low Confidence" | "Stabilizing" | "Rejected",
            "message": "Gesture stabilized" or rejection reason,
            "should_emit": bool (true when newly confirmed and not on cooldown)
        }
        """
        now = time.time()

        if raw_prediction is None or "sign" not in raw_prediction:
            self.history.clear()
            self.current_streak_count = 0
            return {
                "stabilized_sign": None,
                "raw_sign": "NONE",
                "confidence": 0.0,
                "status": "No Hand Detected",
                "message": "No hand detected. Position your hand inside the camera area.",
                "should_emit": False
            }

        sign = raw_prediction.get("sign", "UNKNOWN")
        confidence = raw_prediction.get("confidence", 0.0)

        # 1. Low Confidence Filter
        if confidence < self.confidence_threshold:
            self.history.append({"sign": None, "confidence": confidence})
            self.current_streak_count = 0
            return {
                "stabilized_sign": None,
                "raw_sign": sign,
                "confidence": confidence,
                "status": "Low Confidence",
                "message": "Gesture detected but confidence is too low (< 70%).",
                "should_emit": False
            }

        # 2. Append to Sliding Window
        self.history.append({"sign": sign, "confidence": confidence})

        # 3. Check Streak
        if sign == self.current_streak_sign:
            self.current_streak_count += 1
        else:
            self.current_streak_sign = sign
            self.current_streak_count = 1

        # 4. Modal Voting across window
        valid_votes = [item["sign"] for item in self.history if item["sign"] is not None]
        if not valid_votes:
            return {
                "stabilized_sign": None,
                "raw_sign": sign,
                "confidence": confidence,
                "status": "Rejected",
                "message": "Gesture not recognized confidently",
                "should_emit": False
            }

        from collections import Counter
        vote_counts = Counter(valid_votes)
        majority_sign, count = vote_counts.most_common(1)[0]
        avg_confidence = round(
            sum(item["confidence"] for item in self.history if item["sign"] == majority_sign) / count, 1
        )

        # 5. Check if threshold & streak criteria met
        if count >= self.required_streak and self.current_streak_count >= self.required_streak:
            status = "High Confidence" if avg_confidence >= 85.0 else "Moderate Confidence"
            
            # Check duplicate / cooldown
            is_new = (majority_sign != self.last_emitted_sign) or (now - self.last_emitted_time > self.cooldown_seconds)
            should_emit = False

            if is_new:
                self.last_emitted_sign = majority_sign
                self.last_emitted_time = now
                should_emit = True

            return {
                "stabilized_sign": majority_sign,
                "raw_sign": sign,
                "confidence": avg_confidence,
                "status": status,
                "message": f"Recognized with {status.lower()}",
                "should_emit": should_emit
            }
        else:
            return {
                "stabilized_sign": None,
                "raw_sign": sign,
                "confidence": avg_confidence,
                "status": "Stabilizing",
                "message": f"Stabilizing gesture ({count}/{self.required_streak} frames confirmed)",
                "should_emit": False
            }
