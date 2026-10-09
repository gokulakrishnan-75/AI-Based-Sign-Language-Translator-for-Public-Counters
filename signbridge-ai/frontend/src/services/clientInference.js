// Real-Time In-Browser Deep Neural Network Inference & Stabilization Engine
// Runs genuine forward pass using trained weights exported from MLPClassifier (90 Biomechanical Features).

export function normalizeClientLandmarks(landmarks) {
  // landmarks: array of 21 objects {x, y, z} or arrays [x, y, z]
  const pts = landmarks.map(p => Array.isArray(p) ? [p[0], p[1], p[2] || 0] : [p.x, p.y, p.z || 0]);
  if (pts.length !== 21) return null;

  // 1. Wrist reference translation (invariance to hand position in camera frame)
  const wrist = pts[0];
  const translated = pts.map(p => [p[0] - wrist[0], p[1] - wrist[1], p[2] - wrist[2]]);

  // 2. Canonical handedness alignment:
  // Ensure Pinky MCP (17) is to the right (+X) of Index MCP (5).
  // Guarantees 100% invariance between left hand, right hand, and mirrored webcams!
  if (translated[17][0] < translated[5][0]) {
    for (let i = 0; i < translated.length; i++) {
      translated[i][0] = -translated[i][0];
    }
  }

  // 3. Palm scale normalization (Euclidean distance from wrist 0 to middle MCP 9)
  const mcp9 = translated[9];
  let palmSize = Math.sqrt(mcp9[0] * mcp9[0] + mcp9[1] * mcp9[1] + mcp9[2] * mcp9[2]);
  if (palmSize < 1e-4) {
    let maxDist = 0;
    for (const p of translated) {
      const d = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
      if (d > maxDist) maxDist = d;
    }
    palmSize = maxDist + 1e-5;
  }

  const normalized = translated.map(p => [p[0] / palmSize, p[1] / palmSize, p[2] / palmSize]);

  // Key landmark indices:
  const tipIndices = [4, 8, 12, 16, 20];
  const mcpIndices = [2, 5, 9, 13, 17];

  // Helper Euclidean distance
  const dist3d = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  const norm3d = (a) => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);

  // 4. Finger extension/curl ratios: distance from tip to wrist vs mcp to wrist
  const curls = [];
  for (let i = 0; i < tipIndices.length; i++) {
    const tip = normalized[tipIndices[i]];
    const mcp = normalized[mcpIndices[i]];
    const tipDist = norm3d(tip);
    const mcpDist = norm3d(mcp);
    curls.push(tipDist / (mcpDist + 1e-5));
  }

  // 5. Adjacent finger spreads (consecutive fingertips)
  const spreads = [];
  for (let i = 0; i < tipIndices.length - 1; i++) {
    spreads.push(dist3d(normalized[tipIndices[i]], normalized[tipIndices[i + 1]]));
  }

  // 6. Global finger spreads (Thumb to Pinky, Thumb to Index, Thumb to Middle)
  const thumbPinky = dist3d(normalized[4], normalized[20]);
  const thumbIndex = dist3d(normalized[4], normalized[8]);
  const thumbMiddle = dist3d(normalized[4], normalized[12]);
  const globalSpreads = [thumbPinky, thumbIndex, thumbMiddle];

  // 7. Pinches (Thumb to each fingertip + Index to Middle)
  const pinchThumbIndex = dist3d(normalized[4], normalized[8]);
  const pinchThumbMiddle = dist3d(normalized[4], normalized[12]);
  const pinchThumbRing = dist3d(normalized[4], normalized[16]);
  const pinchThumbPinky = dist3d(normalized[4], normalized[20]);
  const pinchIndexMiddle = dist3d(normalized[8], normalized[12]);
  const pinches = [pinchThumbIndex, pinchThumbMiddle, pinchThumbRing, pinchThumbPinky, pinchIndexMiddle];

  // 8. Vertical finger directions (tip_y - mcp_y)
  const dirsY = [];
  for (let i = 0; i < tipIndices.length; i++) {
    dirsY.push(normalized[tipIndices[i]][1] - normalized[mcpIndices[i]][1]);
  }

  // 9. Finger bend angles: cos(angle) between (MCP - wrist) and (TIP - MCP)
  const bends = [];
  for (let i = 0; i < tipIndices.length; i++) {
    const mcp = normalized[mcpIndices[i]];
    const tip = normalized[tipIndices[i]];
    const v1 = mcp;
    const v2 = [tip[0] - mcp[0], tip[1] - mcp[1], tip[2] - mcp[2]];
    const n1 = norm3d(v1);
    const n2 = norm3d(v2);
    if (n1 > 1e-4 && n2 > 1e-4) {
      const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
      const cosTheta = Math.max(-1.0, Math.min(1.0, dot / (n1 * n2)));
      bends.push(cosTheta);
    } else {
      bends.push(0.0);
    }
  }

  // 63 normalized coordinates + 5 curls + 4 spreads + 3 global spreads + 5 pinches + 5 dirsY + 5 bends = 90 features
  const flatCoords = [];
  for (const p of normalized) {
    flatCoords.push(p[0], p[1], p[2]);
  }

  return [
    ...flatCoords,
    ...curls,
    ...spreads,
    ...globalSpreads,
    ...pinches,
    ...dirsY,
    ...bends
  ];
}

class ClientInferenceEngine {
  constructor() {
    this.weights = null;
    this.isLoaded = false;
    this.classes = [];
    this.init();
  }

  async init() {
    try {
      const res = await fetch('/model_weights.json');
      if (res.ok) {
        this.weights = await res.json();
        this.classes = this.weights.classes || [];
        this.isLoaded = true;
        console.log('[ClientInference] Loaded client neural weights for', this.classes.length, 'signs');
      }
    } catch (e) {
      console.warn('[ClientInference] Could not load client model weights:', e);
    }
  }

  predict(landmarks) {
    if (!this.isLoaded || !this.weights) {
      return null;
    }

    const t0 = performance.now();
    const x = normalizeClientLandmarks(landmarks);
    if (!x || x.length !== 90) return null;

    let current = x;
    const coefs = this.weights.coefs;
    const intercepts = this.weights.intercepts;

    // Forward pass through hidden layers with ReLU
    for (let layer = 0; layer < coefs.length - 1; layer++) {
      const W = coefs[layer]; // shape: [in_features, out_features]
      const b = intercepts[layer];
      const next = new Array(b.length).fill(0);

      for (let j = 0; j < b.length; j++) {
        let sum = b[j];
        for (let i = 0; i < current.length; i++) {
          sum += current[i] * W[i][j];
        }
        // ReLU
        next[j] = Math.max(0, sum);
      }
      current = next;
    }

    // Output layer with Softmax
    const lastLayer = coefs.length - 1;
    const W_out = coefs[lastLayer];
    const b_out = intercepts[lastLayer];
    const logits = new Array(b_out.length).fill(0);

    let maxLogit = -Infinity;
    for (let j = 0; j < b_out.length; j++) {
      let sum = b_out[j];
      for (let i = 0; i < current.length; i++) {
        sum += current[i] * W_out[i][j];
      }
      logits[j] = sum;
      if (sum > maxLogit) maxLogit = sum;
    }

    // Stable softmax
    let sumExp = 0;
    const expVals = logits.map(l => {
      const val = Math.exp(l - maxLogit);
      sumExp += val;
      return val;
    });

    const probabilities = expVals.map(val => val / sumExp);
    const t1 = performance.now();
    const latencyMs = Math.round((t1 - t0) * 100) / 100;

    // Find top-1
    let maxIdx = 0;
    let maxProb = 0;
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }

    const signName = this.classes[maxIdx] || 'UNKNOWN';
    const confidencePct = Math.round(maxProb * 1000) / 10;

    const probDict = {};
    for (let i = 0; i < this.classes.length; i++) {
      probDict[this.classes[i]] = Math.round(probabilities[i] * 1000) / 10;
    }

    return {
      sign: signName,
      class_id: maxIdx,
      confidence: confidencePct,
      latency_ms: latencyMs,
      probabilities: probDict
    };
  }
}

export const clientInferenceEngine = new ClientInferenceEngine();
