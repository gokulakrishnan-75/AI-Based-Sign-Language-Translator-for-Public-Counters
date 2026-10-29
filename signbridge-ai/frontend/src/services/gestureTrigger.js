// Biomechanical Index Finger Pointing Trigger & Handedness Detector (☝️)
// Specifically isolates the user's RIGHT HAND as the explicit "Commit Sign to Sentence" trigger,
// ensuring the index finger is NEVER predicted as a sign and the LEFT hand index finger does NOT commit!

/**
 * Checks whether a given set of 21 MediaPipe landmarks forms an upright index finger pointing gesture (☝️).
 * - Index finger must be well extended upward.
 * - Middle, ring, and pinky fingers must be curled into the palm.
 */
export function checkIsIndexFingerTrigger(landmarks) {
  if (!landmarks || landmarks.length !== 21) return false;
  const wrist = landmarks[0];

  const dist2d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // 1. Distance from wrist to tips & MCPs
  const dIndexTip = dist2d(landmarks[8], wrist);
  const dIndexMcp = dist2d(landmarks[5], wrist);
  const dIndexPip = dist2d(landmarks[6], wrist);

  const dMiddleTip = dist2d(landmarks[12], wrist);
  const dRingTip = dist2d(landmarks[16], wrist);
  const dPinkyTip = dist2d(landmarks[20], wrist);

  // 2. Index finger must be well extended upward:
  // - In camera coordinates (y=0 top, y=1 bottom): tip (8) is higher (smaller y) than PIP (6) and MCP (5)
  // - Distance from wrist to index tip is significantly greater than to index MCP
  const isIndexPointingUp = (landmarks[8].y < landmarks[6].y) && (landmarks[6].y < landmarks[5].y);
  const isIndexExtended = dIndexTip > dIndexMcp * 1.25 && dIndexTip > dIndexPip * 1.08;

  if (!isIndexPointingUp || !isIndexExtended) {
    return false;
  }

  // 3. Middle, Ring, and Pinky must be curled/closed into the palm:
  // - Either tip is below its corresponding PIP (curled down)
  // - OR index finger is significantly longer (> 1.15x) than each of the other fingers
  const isMiddleCurled = (landmarks[12].y > landmarks[10].y) || (dIndexTip > dMiddleTip * 1.15);
  const isRingCurled = (landmarks[16].y > landmarks[14].y) || (dIndexTip > dRingTip * 1.2);
  const isPinkyCurled = (landmarks[20].y > landmarks[18].y) || (dIndexTip > dPinkyTip * 1.2);

  return isMiddleCurled && isRingCurled && isPinkyCurled;
}

/**
 * Computes 3D anatomical chirality (Right vs Left hand) using the invariant triple scalar product
 * of palm vectors: (up x lateral) . thumb.
 * In raw camera coordinates (where x is unmirrored):
 * dot < 0 corresponds to the user's physical Right hand.
 */
export function compute3DChirality(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  try {
    const p0 = landmarks[0];
    const p4 = landmarks[4];
    const p5 = landmarks[5];
    const p9 = landmarks[9];
    const p17 = landmarks[17];

    const up = [p9.x - p0.x, p9.y - p0.y, (p9.z || 0) - (p0.z || 0)];
    const lateral = [p17.x - p5.x, p17.y - p5.y, (p17.z || 0) - (p5.z || 0)];
    const normal = [
      up[1] * lateral[2] - up[2] * lateral[1],
      up[2] * lateral[0] - up[0] * lateral[2],
      up[0] * lateral[1] - up[1] * lateral[0]
    ];
    const thumb = [p4.x - p0.x, p4.y - p0.y, (p4.z || 0) - (p0.z || 0)];
    const dot = normal[0] * thumb[0] + normal[1] * thumb[1] + normal[2] * thumb[2];

    return dot < 0 ? 'Right' : 'Left';
  } catch (e) {
    return null;
  }
}

/**
 * Resolves the physical hand side ('Right' or 'Left') for a given hand.
 * Integrates:
 * 1. MediaPipe multiHandedness label (compensated for raw selfie camera inversion: 'Left' -> Physical Right)
 * 2. Relative screen position when 2 hands are present (Right hand is on user's right side)
 * 3. 3D invariant biomechanical vector chirality
 */
export function resolveHandSide(landmarks, mpHandedness = null, otherHandLandmarks = null, invertMirror = false) {
  if (!landmarks) return 'Unknown';

  // 1. Relative X position if 2 hands are present:
  // In mirrored selfie display (user facing webcam):
  // User's physical Right hand is to user's right, which has smaller raw X (screen-right after CSS mirror).
  // User's physical Left hand is to user's left, which has larger raw X (screen-left after CSS mirror).
  if (otherHandLandmarks && landmarks[0] && otherHandLandmarks[0]) {
    const myWristX = landmarks[0].x;
    const otherWristX = otherHandLandmarks[0].x;
    const isRightByRelativeX = myWristX < otherWristX;
    const detectedSide = isRightByRelativeX ? 'Right' : 'Left';
    if (invertMirror) {
      return detectedSide === 'Right' ? 'Left' : 'Right';
    }
    return detectedSide;
  }

  // 2. MediaPipe multiHandedness label
  if (mpHandedness && mpHandedness.label) {
    // In raw webcam feed fed directly to MediaPipe, MediaPipe's "Left" is the user's physical Right hand
    let mpSide = mpHandedness.label.toLowerCase() === 'left' ? 'Right' : 'Left';
    if (invertMirror) {
      mpSide = mpSide === 'Right' ? 'Left' : 'Right';
    }
    return mpSide;
  }

  // 3. Fallback to 3D vector chirality
  const chiral = compute3DChirality(landmarks);
  if (chiral) {
    return invertMirror ? (chiral === 'Right' ? 'Left' : 'Right') : chiral;
  }

  // 4. Default based on raw screen position (wrist.x < 0.5 in raw is user's physical right)
  const isRightByScreen = landmarks[0] && landmarks[0].x < 0.5;
  const side = isRightByScreen ? 'Right' : 'Left';
  return invertMirror ? (side === 'Right' ? 'Left' : 'Right') : side;
}

/**
 * Analyzes multi-hand detections and separates:
 * - signLandmarks: Landmarks for the hand performing sign gestures (sent to AI prediction).
 * - triggerLandmarks: Landmarks for the hand performing the index trigger gesture (NEVER sent to AI prediction).
 * - isTriggerActive: True only when the required trigger hand (Right Hand) is showing the upright index finger!
 *
 * @param {Array} handsList Array of hand landmarks (each has 21 points)
 * @param {Array} handednessList Array of MediaPipe handedness objects
 * @param {Object} options Configuration options:
 *   - requiredTriggerHand: 'Right' (default) | 'Left' | 'Any'
 *   - invertMirror: boolean (default false)
 */
export function analyzeMultiHands(handsList = [], handednessList = [], options = {}) {
  const {
    requiredTriggerHand = 'Right', // User requested: ONLY Right Hand index finger should add words!
    invertMirror = false,
    requireIndexTrigger = true
  } = options;

  if (!handsList || handsList.length === 0) {
    return {
      signLandmarks: null,
      triggerLandmarks: null,
      isTriggerActive: false,
      handsCount: 0,
      handsMeta: []
    };
  }

  // Analyze metadata for each detected hand
  const handsMeta = handsList.map((hand, idx) => {
    const otherHand = handsList.length > 1 ? handsList[idx === 0 ? 1 : 0] : null;
    const mpHandedness = handednessList && handednessList[idx] ? handednessList[idx] : null;
    const handSide = resolveHandSide(hand, mpHandedness, otherHand, invertMirror);
    const isIndexTrigger = checkIsIndexFingerTrigger(hand);

    // Is this hand eligible to be the commit trigger according to user requirements?
    let isEligibleTrigger = false;
    if (isIndexTrigger && requireIndexTrigger) {
      if (requiredTriggerHand === 'Any') {
        isEligibleTrigger = true;
      } else if (requiredTriggerHand === 'Right' && handSide === 'Right') {
        isEligibleTrigger = true;
      } else if (requiredTriggerHand === 'Left' && handSide === 'Left') {
        isEligibleTrigger = true;
      }
    }

    return {
      index: idx,
      landmarks: hand,
      handSide, // 'Right' | 'Left'
      isIndexTrigger,
      isEligibleTrigger,
      mpHandedness
    };
  });

  // If index trigger requirement is disabled, feed primary hand to sign classifier
  if (!requireIndexTrigger) {
    return {
      signLandmarks: handsMeta[0].landmarks,
      triggerLandmarks: null,
      signHandSide: handsMeta[0].handSide,
      triggerHandSide: null,
      isTriggerActive: false,
      handsCount: handsMeta.length,
      handsMeta,
      message: `${handsMeta[0].handSide.toUpperCase()} HAND (SIGNING)`
    };
  }

  // CASE 1: Single hand in frame
  if (handsMeta.length === 1) {
    const single = handsMeta[0];

    if (single.isEligibleTrigger) {
      return {
        signLandmarks: single.landmarks, // Allow sign classifier to predict (e.g. WHERE)
        triggerLandmarks: single.landmarks,
        triggerHandSide: single.handSide,
        isTriggerActive: true,
        handsCount: 1,
        handsMeta,
        message: `${single.handSide.toUpperCase()} HAND TRIGGER ACTIVE ☝️`
      };
    } else if (single.isIndexTrigger && !single.isEligibleTrigger) {
      // Index finger shown on other hand
      return {
        signLandmarks: single.landmarks,
        triggerLandmarks: single.landmarks,
        triggerHandSide: single.handSide,
        isTriggerActive: false,
        handsCount: 1,
        handsMeta,
        message: `${single.handSide.toUpperCase()} HAND (SIGNING)`
      };
    } else {
      // Regular Sign Hand
      return {
        signLandmarks: single.landmarks,
        triggerLandmarks: null,
        signHandSide: single.handSide,
        isTriggerActive: false,
        handsCount: 1,
        handsMeta,
        message: `${single.handSide.toUpperCase()} HAND (SIGNING)`
      };
    }
  }

  // CASE 2: Two hands in frame (Simultaneous Sign Hand + Trigger Hand)
  const hand0 = handsMeta[0];
  const hand1 = handsMeta[1];

  let signHand = null;
  let triggerHand = null;
  let isTriggerActive = false;

  if (hand0.isEligibleTrigger && !hand1.isEligibleTrigger) {
    triggerHand = hand0;
    signHand = hand1;
    isTriggerActive = true;
  } else if (hand1.isEligibleTrigger && !hand0.isEligibleTrigger) {
    triggerHand = hand1;
    signHand = hand0;
    isTriggerActive = true;
  } else if (hand0.isIndexTrigger && !hand0.isEligibleTrigger) {
    // Hand 0 is index finger but wrong side (e.g. Left)
    triggerHand = hand0;
    signHand = hand1;
    isTriggerActive = false;
  } else if (hand1.isIndexTrigger && !hand1.isEligibleTrigger) {
    // Hand 1 is index finger but wrong side (e.g. Left)
    triggerHand = hand1;
    signHand = hand0;
    isTriggerActive = false;
  } else {
    // Neither hand is an index finger trigger:
    // Designate the non-preferred hand as primary sign hand, or Left hand as sign hand if Right is trigger
    if (requiredTriggerHand === 'Right') {
      const leftHand = handsMeta.find(h => h.handSide === 'Left') || hand0;
      signHand = leftHand;
    } else {
      signHand = hand0;
    }
    isTriggerActive = false;
  }

  return {
    signLandmarks: signHand ? signHand.landmarks : null,
    triggerLandmarks: triggerHand ? triggerHand.landmarks : null,
    signHandSide: signHand ? signHand.handSide : null,
    triggerHandSide: triggerHand ? triggerHand.handSide : null,
    isTriggerActive,
    handsCount: 2,
    handsMeta,
    message: isTriggerActive 
      ? `☝️ ${triggerHand.handSide.toUpperCase()} HAND TRIGGER ACTIVE: COMMITTING SIGN` 
      : (triggerHand ? `⚠️ TRIGGER REQUIRES ${requiredTriggerHand.toUpperCase()} HAND (☝️)` : 'TWO HANDS TRACKED')
  };
}
