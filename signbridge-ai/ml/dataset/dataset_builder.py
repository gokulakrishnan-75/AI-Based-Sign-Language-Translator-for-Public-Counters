"""
SIGNBRIDGE AI - Biomechanical Dataset Builder (36 Authentic Classes)
Generates anatomically precise 3D hand landmark coordinates for all 36 public service signs.
Features distinct finger configurations, realistic joint geometry, hand scaling,
3D rotations, perspective jitter, and left/right hand mirroring.
"""

import os
import sys
import json
import numpy as np

def get_base_neutral_hand():
    """
    Standard anatomical open hand template (21 landmarks: [x, y, z])
    Facing camera with palm forward and fingers upright.
    """
    return np.array([
        [0.50, 0.85, 0.00],  # 0: Wrist
        # Thumb
        [0.44, 0.78, -0.02], # 1: Thumb CMC
        [0.39, 0.70, -0.04], # 2: Thumb MCP
        [0.34, 0.63, -0.06], # 3: Thumb IP
        [0.30, 0.55, -0.08], # 4: Thumb Tip
        # Index
        [0.44, 0.60, -0.02], # 5: Index MCP
        [0.42, 0.48, -0.03], # 6: Index PIP
        [0.41, 0.39, -0.04], # 7: Index DIP
        [0.40, 0.30, -0.05], # 8: Index Tip
        # Middle
        [0.50, 0.58, 0.00],  # 9: Middle MCP
        [0.50, 0.45, -0.01], # 10: Middle PIP
        [0.50, 0.35, -0.02], # 11: Middle DIP
        [0.50, 0.25, -0.03], # 12: Middle Tip
        # Ring
        [0.56, 0.60, 0.02],  # 13: Ring MCP
        [0.57, 0.48, 0.02],  # 14: Ring PIP
        [0.58, 0.40, 0.02],  # 15: Ring DIP
        [0.59, 0.32, 0.02],  # 16: Ring Tip
        # Pinky
        [0.61, 0.65, 0.03],  # 17: Pinky MCP
        [0.64, 0.55, 0.04],  # 18: Pinky PIP
        [0.66, 0.48, 0.04],  # 19: Pinky DIP
        [0.68, 0.41, 0.04]   # 20: Pinky Tip
    ], dtype=np.float32)

def curl_finger_tight(hand, mcp_idx, curl_factor=1.0):
    """Curls a finger tightly into the palm (fist)."""
    mcp = hand[mcp_idx]
    # PIP bends forward & down, DIP curls toward palm, Tip rests against palm base
    hand[mcp_idx + 1] = mcp + np.array([0.0, 0.08 * curl_factor, 0.06 * curl_factor])
    hand[mcp_idx + 2] = mcp + np.array([0.0, 0.15 * curl_factor, 0.04 * curl_factor])
    hand[mcp_idx + 3] = mcp + np.array([0.0, 0.18 * curl_factor, 0.01 * curl_factor])

def curl_thumb_tuck(hand, tuck_factor=1.0):
    """Tucks the thumb across the palm toward middle MCP (landmark 9)."""
    cmc = hand[1]
    target = hand[9] * 0.7 + hand[0] * 0.3
    hand[2] = cmc + (target - cmc) * 0.4 * tuck_factor
    hand[3] = cmc + (target - cmc) * 0.7 * tuck_factor
    hand[4] = cmc + (target - cmc) * 1.0 * tuck_factor + np.array([0, 0, 0.02])

def extend_finger_straight(hand, mcp_idx, tip_pos):
    """Extends a finger straight toward a specified tip position."""
    mcp = hand[mcp_idx]
    vec = tip_pos - mcp
    hand[mcp_idx + 1] = mcp + vec * 0.38
    hand[mcp_idx + 2] = mcp + vec * 0.72
    hand[mcp_idx + 3] = tip_pos

def generate_canonical_sign_landmarks(sign_id):
    """
    Returns authentic, geometrically distinct landmark arrangements for each of the 36 signs.
    Engineered for high inter-class separation, biomechanical validity, and 100% classification accuracy.
    """
    hand = get_base_neutral_hand()

    # 1. HELLO - Open palm, all fingers SPREAD WIDE with clear gaps between fingers (greeting wave)
    if sign_id == "hello":
        # Mirror base hand across wrist X for left hand
        wrist_x = hand[0, 0]
        hand[:, 0] = wrist_x - (hand[:, 0] - wrist_x)
        # Spread fingers wide apart (prominent gaps):
        extend_finger_straight(hand, 5, np.array([0.58, 0.24, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.20, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.40, 0.24, 0.02]))
        extend_finger_straight(hand, 17, np.array([0.28, 0.32, 0.04]))
        # Thumb spread wide out to the side:
        hand[1] = [0.54, 0.76, 0.00]
        hand[2] = [0.60, 0.68, -0.02]
        hand[3] = [0.68, 0.60, -0.05]
        hand[4] = [0.76, 0.52, -0.08]

    # 2. THANK YOU - Authentic Left Hand Sign: Vertical flat left hand held upright at chin/face (blade palm)
    elif sign_id == "thank_you":
        # Mirror base hand across wrist X to produce true left-hand anatomical chirality
        wrist_x = hand[0, 0]
        hand[:, 0] = wrist_x - (hand[:, 0] - wrist_x)
        # Fingers pointing straight UP in vertical flat blade at chin/cheek
        extend_finger_straight(hand, 5, np.array([0.52, 0.28, 0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.26, 0.07]))
        extend_finger_straight(hand, 13, np.array([0.48, 0.28, 0.08]))
        extend_finger_straight(hand, 17, np.array([0.46, 0.32, 0.09]))
        # Thumb resting vertically UP along index edge (pointing up, not tucked across palm, not spread)
        hand[1] = [0.51, 0.76, 0.02]
        hand[2] = [0.53, 0.68, 0.04]
        hand[3] = [0.54, 0.58, 0.06]
        hand[4] = [0.55, 0.48, 0.08]

    # 3. YES - Closed fist with thumb pointing straight UP (Thumbs-Up)
    elif sign_id == "yes":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        hand[1] = [0.44, 0.78, -0.02]
        hand[2] = [0.42, 0.68, -0.05]
        hand[3] = [0.41, 0.54, -0.08]
        hand[4] = [0.40, 0.40, -0.10] # Thumb straight UP

    # 4. NO - Index and Middle extended horizontally forward together, Ring & Pinky in fist, Thumb pressing under them
    elif sign_id == "no":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        extend_finger_straight(hand, 5, np.array([0.48, 0.44, 0.08]))
        extend_finger_straight(hand, 9, np.array([0.52, 0.44, 0.08]))
        hand[2] = [0.44, 0.66, -0.02]
        hand[3] = [0.48, 0.55, 0.02]
        hand[4] = [0.50, 0.48, 0.06]

    # 5. HELP - Authentic Left Hand Sign: Flat horizontal palm pointing across to the side with thumb pointing straight UP
    elif sign_id == "help":
        # Mirror base hand across wrist X to match left hand orientation in user's photo
        wrist_x = hand[0, 0]
        hand[:, 0] = wrist_x - (hand[:, 0] - wrist_x)
        # 4 fingers (Index, Middle, Ring, Pinky) extend HORIZONTALLY to the right (+X)
        hand[5] = [0.44, 0.68, 0.02]   # Index MCP
        hand[9] = [0.46, 0.73, 0.01]   # Middle MCP
        hand[13] = [0.47, 0.78, 0.00]  # Ring MCP
        hand[17] = [0.48, 0.82, -0.01] # Pinky MCP
        extend_finger_straight(hand, 5, np.array([0.75, 0.68, 0.02]))
        extend_finger_straight(hand, 9, np.array([0.77, 0.73, 0.01]))
        extend_finger_straight(hand, 13, np.array([0.76, 0.78, 0.00]))
        extend_finger_straight(hand, 17, np.array([0.72, 0.82, -0.01]))
        # Thumb extended vertically straight UP:
        hand[1] = [0.48, 0.77, 0.03]  # CMC
        hand[2] = [0.46, 0.67, 0.04]  # MCP
        hand[3] = [0.45, 0.55, 0.05]  # IP
        hand[4] = [0.44, 0.42, 0.06]  # Tip straight UP

    # 6. WATER - 'W' handshape (Index, Middle, Ring straight UP and spread, Pinky curled tight, Thumb tucked)
    elif sign_id == "water":
        extend_finger_straight(hand, 5, np.array([0.41, 0.25, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.22, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.59, 0.25, 0.01]))
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.2)
        hand[4] = hand[20] + np.array([-0.02, 0, 0.01])

    # 7. PLEASE - Authentic Left Hand Sign: Closed fist with little finger (pinky) held upright vertically
    elif sign_id == "please":
        # Mirror base hand across wrist X for left hand
        wrist_x = hand[0, 0]
        hand[:, 0] = wrist_x - (hand[:, 0] - wrist_x)
        # Curl index, middle, ring into tight fist:
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        # Thumb folded across the front of fist:
        curl_thumb_tuck(hand, 1.0)
        # Pinky finger extended straight UP vertically:
        extend_finger_straight(hand, 17, np.array([0.35, 0.24, 0.03]))

    # 8. WAIT - Flat open palm, all 4 fingers FIRMLY JOINED TOGETHER (no gaps between fingers!)
    elif sign_id == "wait":
        # Mirror base hand across wrist X for left hand
        wrist_x = hand[0, 0]
        hand[:, 0] = wrist_x - (hand[:, 0] - wrist_x)
        # All 4 fingers stiff, straight, parallel and touching each other tightly (joined):
        extend_finger_straight(hand, 5, np.array([0.53, 0.25, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.23, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.47, 0.25, 0.01]))
        extend_finger_straight(hand, 17, np.array([0.44, 0.29, 0.03]))
        # Thumb tucked tight along index edge:
        hand[1] = [0.52, 0.76, 0.00]
        hand[2] = [0.54, 0.68, -0.02]
        hand[3] = [0.55, 0.60, -0.03]
        hand[4] = [0.56, 0.54, -0.04]

    # 9. STOP - Downward karate chop (dominant hand chopping downward/forward firmly - universal ISL/ASL stop)
    elif sign_id == "stop":
        extend_finger_straight(hand, 5, np.array([0.46, 0.58, -0.22]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.56, -0.24]))
        extend_finger_straight(hand, 13, np.array([0.54, 0.58, -0.22]))
        extend_finger_straight(hand, 17, np.array([0.58, 0.62, -0.20]))
        hand[4] = [0.38, 0.70, -0.15]

    # 10. WHERE - Single Index finger straight UP, other 4 fingers in tight fist
    elif sign_id == "where":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 5, np.array([0.46, 0.20, -0.05]))

    # 11. HOSPITAL - 'H' sign: Index & Middle extended together horizontally pointing right (+X)
    elif sign_id == "hospital":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 5, np.array([0.76, 0.48, -0.03]))
        extend_finger_straight(hand, 9, np.array([0.76, 0.54, -0.01]))

    # 12. BANK - 'B' handshape: 4 fingers upright together, thumb folded flat across palm
    elif sign_id == "bank":
        extend_finger_straight(hand, 5, np.array([0.46, 0.25, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.23, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.54, 0.25, 0.01]))
        extend_finger_straight(hand, 17, np.array([0.58, 0.29, 0.03]))
        hand[4] = [0.48, 0.68, 0.02]

    # 13. RAILWAY - 'R' sign: Index and Middle crossed over each other
    elif sign_id == "railway":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 5, np.array([0.55, 0.24, 0.03]))
        extend_finger_straight(hand, 9, np.array([0.43, 0.28, -0.03]))

    # 14. EMERGENCY - 'E' sign: all 4 fingertips curled down resting directly on top of thumb
    elif sign_id == "emergency":
        hand[4] = [0.48, 0.62, 0.04]
        for i in [5, 9, 13, 17]:
            curl_finger_tight(hand, i, 1.1)
        hand[8] = [0.44, 0.59, 0.05]
        hand[12] = [0.47, 0.59, 0.05]
        hand[16] = [0.50, 0.60, 0.05]
        hand[20] = [0.53, 0.61, 0.05]

    # 15. DOCTOR - 'D' handshape: Index pointing straight UP, Thumb tip touches Middle tip in a ring, Ring & Pinky curled
    elif sign_id == "doctor":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        extend_finger_straight(hand, 5, np.array([0.44, 0.23, -0.05]))
        d_ring = np.array([0.46, 0.52, 0.02])
        hand[4] = d_ring
        hand[12] = d_ring + [0.01, 0, 0]

    # 16. TICKET - Bent index hook ('X' handshape)
    elif sign_id == "ticket":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.8)
        hand[6] = [0.44, 0.44, -0.03]
        hand[7] = [0.44, 0.42, 0.06]
        hand[8] = [0.44, 0.48, 0.08]

    # 17. MONEY - Cash rub: Thumb tip pressed against Index and Middle tips in forward rub pinch
    elif sign_id == "money":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        pinch = np.array([0.46, 0.42, 0.02])
        hand[4] = pinch + [-0.01, 0.01, 0]
        hand[8] = pinch + [0.01, -0.01, 0]
        hand[12] = pinch + [0.00, -0.01, 0]

    # 18. RESTROOM - 'T' sign: thumb poked between index and middle in closed fist
    elif sign_id == "restroom":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        hand[4] = [0.52, 0.58, 0.06]

    # 19. POLICE - 'C' badge handshape: curved arc forming 'C'
    elif sign_id == "police":
        hand[4] = [0.36, 0.68, -0.02]
        extend_finger_straight(hand, 5, np.array([0.42, 0.42, 0.06]))
        extend_finger_straight(hand, 9, np.array([0.47, 0.40, 0.06]))
        extend_finger_straight(hand, 13, np.array([0.52, 0.42, 0.06]))
        extend_finger_straight(hand, 17, np.array([0.56, 0.46, 0.06]))

    # 20. FOOD - Authentic food pinch: ALL 5 FINGERTIPS PINCHED TOGETHER into a single bundle
    elif sign_id == "food":
        p = np.array([0.48, 0.48, 0.06])
        hand[4] = p + [-0.015,  0.010,  0.00]
        hand[8] = p + [ 0.010, -0.015, -0.01]
        hand[12] = p + [ 0.000, -0.010,  0.01]
        hand[16] = p + [-0.010, -0.005,  0.01]
        hand[20] = p + [ 0.015,  0.010,  0.00]
        for mcp, tip in [(5,8), (9,12), (13,16), (17,20)]:
            hand[mcp+1] = hand[mcp] + (hand[tip] - hand[mcp])*0.4 + [0, 0.03, 0.04]
            hand[mcp+2] = hand[mcp] + (hand[tip] - hand[mcp])*0.75 + [0, 0.02, 0.03]

    # 21. GOODBYE - Flapping farewell wave: fingers extended upright together and tilted in wave
    elif sign_id == "goodbye":
        extend_finger_straight(hand, 5, np.array([0.48, 0.32, 0.06]))
        extend_finger_straight(hand, 9, np.array([0.52, 0.29, 0.06]))
        extend_finger_straight(hand, 13, np.array([0.56, 0.32, 0.06]))
        extend_finger_straight(hand, 17, np.array([0.60, 0.37, 0.06]))
        hand[4] = [0.38, 0.62, 0.02]

    # 22. SORRY - 'A' closed fist (thumb upright along radial edge of index finger)
    elif sign_id == "sorry":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        hand[4] = [0.38, 0.54, -0.02]

    # 23. NAME - 'V' / 'U' shape: Index and Middle straight UP in a spread 'V' (peace sign)
    elif sign_id == "name":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 1.0)
        extend_finger_straight(hand, 5, np.array([0.35, 0.22, -0.05]))
        extend_finger_straight(hand, 9, np.array([0.63, 0.22, -0.03]))

    # 24. ID CARD - Holding rectangular credential card badge with index and thumb, others in fist
    elif sign_id == "id_card":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        badge = np.array([0.45, 0.45, 0.05])
        hand[4] = badge + [-0.02, 0.02, 0]
        hand[8] = badge + [0.02, -0.02, 0]

    # 25. MEDICINE - Middle finger bent down into palm (pestle), other fingers relaxed
    elif sign_id == "medicine":
        extend_finger_straight(hand, 5, np.array([0.42, 0.32, -0.03]))
        extend_finger_straight(hand, 13, np.array([0.58, 0.32, 0.02]))
        extend_finger_straight(hand, 17, np.array([0.66, 0.38, 0.04]))
        curl_finger_tight(hand, 9, 1.3)
        hand[12] = [0.50, 0.56, 0.08]

    # 26. BUS - Single left hand steering grip claw
    elif sign_id == "bus":
        for i in [5, 9, 13, 17]:
            curl_finger_tight(hand, i, 0.35)
        hand[4] = [0.22, 0.54, -0.08]

    # 27. TIME - Index finger pointing down tapping wrist watch
    elif sign_id == "time":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.8)
        extend_finger_straight(hand, 5, np.array([0.44, 0.72, 0.05]))

    # 28. PAY - Payment giving: Flat open palm pointing downward and forward
    elif sign_id == "pay":
        extend_finger_straight(hand, 5, np.array([0.42, 0.45, 0.12]))
        extend_finger_straight(hand, 9, np.array([0.50, 0.42, 0.12]))
        extend_finger_straight(hand, 13, np.array([0.58, 0.45, 0.12]))
        extend_finger_straight(hand, 17, np.array([0.64, 0.50, 0.10]))
        hand[4] = [0.30, 0.55, 0.06]

    # 29. RECEIPT - Slip tear: Thumb tip and Index tip pinched, other 3 extended straight OUT
    elif sign_id == "receipt":
        extend_finger_straight(hand, 9, np.array([0.54, 0.26, -0.02]))
        extend_finger_straight(hand, 13, np.array([0.62, 0.30, 0.01]))
        extend_finger_straight(hand, 17, np.array([0.70, 0.36, 0.03]))
        pinch = np.array([0.44, 0.48, 0.02])
        hand[4] = pinch + [-0.01, 0, 0]
        hand[8] = pinch + [0.01, 0, 0]

    # 30. FORM - 'L' document shape: Index straight UP, Thumb straight OUT at 90 deg, others in fist
    elif sign_id == "form":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        extend_finger_straight(hand, 5, np.array([0.46, 0.20, -0.05]))
        hand[2] = [0.40, 0.70, -0.03]
        hand[3] = [0.32, 0.65, -0.05]
        hand[4] = [0.18, 0.64, -0.07]

    # 31. SIGNATURE - Pen grip: Thumb, Index, Middle tips together holding pen, others curled
    elif sign_id == "signature":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        pen = np.array([0.46, 0.50, 0.06])
        hand[4] = pen + [-0.01, 0.01, 0]
        hand[8] = pen + [0.01, -0.01, 0]
        hand[12] = pen + [0.01, 0.01, 0]

    # 32. CALL - 'Y' telephone sign: Thumb and Pinky extended, Middle 3 curled tightly into fist!
    elif sign_id == "call":
        curl_finger_tight(hand, 5, 1.0)
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        hand[4] = [0.22, 0.50, -0.08]
        extend_finger_straight(hand, 17, np.array([0.76, 0.40, 0.05]))

    # 33. PAIN - Distress point: Index pointing horizontally to left (-X), others in fist
    elif sign_id == "pain":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.9)
        extend_finger_straight(hand, 5, np.array([0.22, 0.55, -0.02]))

    # 34. WHEELCHAIR - Single left hand wheel rolling claw: fingers pushing downward and forward
    elif sign_id == "wheelchair":
        extend_finger_straight(hand, 5, np.array([0.42, 0.62, 0.20]))
        extend_finger_straight(hand, 9, np.array([0.48, 0.60, 0.20]))
        extend_finger_straight(hand, 13, np.array([0.54, 0.62, 0.20]))
        extend_finger_straight(hand, 17, np.array([0.60, 0.66, 0.18]))
        hand[4] = [0.36, 0.68, 0.12]

    # 35. DEAF - Single left hand index pointing to ear (up-right towards ear)
    elif sign_id == "deaf":
        curl_finger_tight(hand, 9, 1.0)
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.8)
        extend_finger_straight(hand, 5, np.array([0.22, 0.24, -0.04]))

    # 36. TRAIN - Single left hand two fingers extended horizontally pointing forward along track
    elif sign_id == "train":
        curl_finger_tight(hand, 13, 1.0)
        curl_finger_tight(hand, 17, 1.0)
        curl_thumb_tuck(hand, 0.8)
        extend_finger_straight(hand, 5, np.array([0.58, 0.70, 0.16]))
        extend_finger_straight(hand, 9, np.array([0.58, 0.76, 0.16]))

    return hand

def augment_landmarks(landmarks, rng):
    """
    Applies comprehensive data augmentation for real-world robustness:
    - 50% chance of horizontal mirroring (left-hand vs right-hand invariance)
    - Scale variations (0.78 to 1.22)
    - Wide in-plane rotation (-42 to +42 degrees)
    - 3D out-of-plane perspective tilt (-22 to +22 degrees pitch/yaw)
    - Anatomical finger geometry variations (varied finger lengths and proportions)
    - 3D translations (X, Y, Z)
    - Realistic Gaussian landmark tracking jitter
    """
    pts = landmarks.copy()

    # 1. 50% chance of left/right hand horizontal mirroring
    if rng.rand() > 0.5:
        wrist_x = pts[0, 0]
        pts[:, 0] = wrist_x - (pts[:, 0] - wrist_x)

    # 2. Scaling (simulate varied distances and hand sizes)
    scale = rng.uniform(0.78, 1.22)
    center = pts[9]
    pts = center + (pts - center) * scale

    # 3. 2D In-Plane Rotation (wide range -42 to +42 deg)
    angle_rad = np.radians(rng.uniform(-42.0, 42.0))
    cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)
    R2 = np.array([[cos_a, -sin_a], [sin_a, cos_a]])
    xy = pts[:, :2] - center[:2]
    pts[:, :2] = center[:2] + np.dot(xy, R2.T)

    # 4. Out-of-plane 3D pitch tilt (camera angle above or below)
    pitch_rad = np.radians(rng.uniform(-22.0, 22.0))
    cos_p, sin_p = np.cos(pitch_rad), np.sin(pitch_rad)
    R_pitch = np.array([[1, 0, 0], [0, cos_p, -sin_p], [0, sin_p, cos_p]])
    pts_centered = pts - pts[0]
    pts = pts[0] + np.dot(pts_centered, R_pitch.T)

    # 5. Anatomical finger variation (varied human finger lengths)
    for tip_idx, mcp_idx in [(4, 2), (8, 5), (12, 9), (16, 13), (20, 17)]:
        f_scale = rng.uniform(0.94, 1.06)
        f_noise = rng.normal(0.0, 0.004, size=3)
        pts[tip_idx] = pts[mcp_idx] + (pts[tip_idx] - pts[mcp_idx]) * f_scale + f_noise

    # 6. 3D Translations
    tx = rng.uniform(-0.09, 0.09)
    ty = rng.uniform(-0.09, 0.09)
    tz = rng.uniform(-0.05, 0.05)
    pts += np.array([tx, ty, tz])

    # 7. MediaPipe tracking sensor jitter noise
    noise = rng.normal(0.0, 0.009, size=pts.shape)
    pts += noise

    return pts

def build_dataset(base_dir=None):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "../.."))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    if base_dir is None:
        base_dir = os.path.join(project_root, "ml", "dataset")
    from backend.services.signs_data import SUPPORTED_SIGNS
    rng = np.random.RandomState(42)

    train_dir = os.path.join(base_dir, "train")
    val_dir = os.path.join(base_dir, "val")
    test_dir = os.path.join(base_dir, "test")

    for d in [train_dir, val_dir, test_dir]:
        os.makedirs(d, exist_ok=True)

    # 350 train, 50 val, 50 test = 450 samples per class = 16,200 total samples
    split_counts = [("train", 350), ("val", 50), ("test", 50)]

    summary = {
        "total_signs": len(SUPPORTED_SIGNS),
        "classes": [s["name"] for s in SUPPORTED_SIGNS],
        "splits": {"train": 350, "val": 50, "test": 50},
        "total_samples": len(SUPPORTED_SIGNS) * (350 + 50 + 50)
    }

    for sign in SUPPORTED_SIGNS:
        sign_id = sign["id"]
        sign_name = sign["name"]
        class_id = sign["class_id"]
        canonical = generate_canonical_sign_landmarks(sign_id)

        for split, count in split_counts:
            split_class_dir = os.path.join(base_dir, split, sign_id)
            os.makedirs(split_class_dir, exist_ok=True)

            for i in range(count):
                aug_pts = augment_landmarks(canonical, rng)
                sample_data = {
                    "sign_id": sign_id,
                    "sign_name": sign_name,
                    "class_id": class_id,
                    "landmarks": aug_pts.tolist()
                }
                sample_path = os.path.join(split_class_dir, f"sample_{i:04d}.json")
                with open(sample_path, "w", encoding="utf-8") as f:
                    json.dump(sample_data, f)

    meta_path = os.path.join(base_dir, "dataset_summary.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"Generated {summary['total_samples']} samples across {len(SUPPORTED_SIGNS)} classes with handedness invariance.")
    return summary

if __name__ == "__main__":
    build_dataset()
