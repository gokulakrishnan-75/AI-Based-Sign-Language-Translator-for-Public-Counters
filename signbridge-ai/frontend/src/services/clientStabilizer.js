// Client-Side Multi-Frame Prediction Stabilizer

export class ClientStabilizer {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 5;
    this.confidenceThreshold = options.confidenceThreshold || 70.0;
    this.requiredStreak = options.requiredStreak || 3;
    this.cooldownMs = options.cooldownMs || 1400;

    this.history = [];
    this.lastEmittedSign = null;
    this.lastEmittedTime = 0;
    this.currentStreakSign = null;
    this.currentStreakCount = 0;
  }

  reset() {
    this.history = [];
    this.lastEmittedSign = null;
    this.lastEmittedTime = 0;
    this.currentStreakSign = null;
    this.currentStreakCount = 0;
  }

  process(rawPrediction) {
    const now = performance.now();

    if (!rawPrediction || !rawPrediction.sign) {
      this.history = [];
      this.currentStreakCount = 0;
      return {
        stabilizedSign: null,
        rawSign: 'NONE',
        confidence: 0,
        status: 'No Hand Detected',
        message: 'No hand detected. Position your hand inside the camera area.',
        shouldEmit: false
      };
    }

    const { sign, confidence } = rawPrediction;

    // 1. Low Confidence Filter
    if (confidence < this.confidenceThreshold) {
      this.history.push({ sign: null, confidence });
      if (this.history.length > this.windowSize) this.history.shift();
      this.currentStreakCount = 0;
      return {
        stabilizedSign: null,
        rawSign: sign,
        confidence,
        status: 'Low Confidence',
        message: 'Gesture detected but confidence is too low (< 70%).',
        shouldEmit: false
      };
    }

    // 2. Append to window
    this.history.push({ sign, confidence });
    if (this.history.length > this.windowSize) this.history.shift();

    // 3. Update Streak
    if (sign === this.currentStreakSign) {
      this.currentStreakCount++;
    } else {
      this.currentStreakSign = sign;
      this.currentStreakCount = 1;
    }

    // 4. Modal voting across sliding window
    const validItems = this.history.filter(h => h.sign !== null);
    if (validItems.length === 0) {
      return {
        stabilizedSign: null,
        rawSign: sign,
        confidence,
        status: 'Rejected',
        message: 'Gesture not recognized confidently',
        shouldEmit: false
      };
    }

    const counts = {};
    for (const item of validItems) {
      counts[item.sign] = (counts[item.sign] || 0) + 1;
    }

    let majoritySign = null;
    let maxCount = 0;
    for (const [s, cnt] of Object.entries(counts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        majoritySign = s;
      }
    }

    const matchingItems = validItems.filter(h => h.sign === majoritySign);
    const avgConfidence = Math.round(
      (matchingItems.reduce((acc, h) => acc + h.confidence, 0) / matchingItems.length) * 10
    ) / 10;

    // Check if streak requirement is satisfied
    if (maxCount >= this.requiredStreak && this.currentStreakCount >= this.requiredStreak) {
      const status = avgConfidence >= 85.0 ? 'High Confidence' : 'Moderate Confidence';
      const isNew = majoritySign !== this.lastEmittedSign || (now - this.lastEmittedTime > this.cooldownMs);
      let shouldEmit = false;

      if (isNew) {
        this.lastEmittedSign = majoritySign;
        this.lastEmittedTime = now;
        shouldEmit = true;
      }

      return {
        stabilizedSign: majoritySign,
        rawSign: sign,
        confidence: avgConfidence,
        status,
        message: `Recognized with ${status.toLowerCase()}`,
        shouldEmit
      };
    } else {
      return {
        stabilizedSign: null,
        rawSign: sign,
        confidence: avgConfidence,
        status: 'Stabilizing',
        message: `Stabilizing gesture (${maxCount}/${this.requiredStreak} frames confirmed)`,
        shouldEmit: false
      };
    }
  }
}
