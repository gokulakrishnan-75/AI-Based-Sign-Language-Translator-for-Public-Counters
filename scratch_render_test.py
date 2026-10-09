import os
import sys
sys.path.insert(0, "signbridge-ai")
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from ml.dataset.dataset_builder import generate_canonical_sign_landmarks

WIDTH = 800
HEIGHT = 600

def create_studio_bg():
    y, x = np.ogrid[:HEIGHT, :WIDTH]
    dist = np.sqrt((x - 400)**2 + (y - 280)**2)
    t = np.clip(dist / 450.0, 0, 1)
    falloff = (1.0 - np.cos(t * np.pi)) / 2.0
    r = 14 * (1 - falloff) + 5 * falloff
    g = 24 * (1 - falloff) + 9 * falloff
    b = 42 * (1 - falloff) + 16 * falloff
    bg = np.stack([r, g, b], axis=-1).astype(np.uint8)
    return Image.fromarray(bg, mode='RGB')

def render_sign_image(sign_id, name):
    lm = generate_canonical_sign_landmarks(sign_id)
    # Map normalized coords to canvas
    # Center hand in 800x600 canvas
    pts = lm[:, :2].copy()
    # Normalize bounds
    min_xy = pts.min(axis=0)
    max_xy = pts.max(axis=0)
    center = (min_xy + max_xy) / 2.0
    span = max(max_xy - min_xy)
    scale = 340.0 / max(span, 0.2)
    
    pixel_pts = []
    for i in range(21):
        px = 400 + (pts[i, 0] - center[0]) * scale
        py = 280 + (pts[i, 1] - center[1]) * scale
        pixel_pts.append((px, py, lm[i, 2]))
        
    bg = create_studio_bg()
    
    # Render on overlay with alpha
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # 1. Soft Shadow
    shadow_offset = (12, 16)
    palm_indices = [0, 5, 9, 13, 17]
    palm_poly_shadow = [(pixel_pts[i][0] + shadow_offset[0], pixel_pts[i][1] + shadow_offset[1]) for i in palm_indices]
    draw.polygon(palm_poly_shadow, fill=(0, 0, 0, 90))
    
    # 2. Forearm / Wrist base
    wrist = pixel_pts[0]
    draw.polygon([
        (wrist[0] - 38, wrist[1] + 10),
        (wrist[0] + 38, wrist[1] + 10),
        (wrist[0] + 46, HEIGHT),
        (wrist[0] - 46, HEIGHT)
    ], fill=(210, 155, 125, 255))
    
    # 3. Palm Webbing flesh
    palm_poly = [(pixel_pts[i][0], pixel_pts[i][1]) for i in palm_indices]
    draw.polygon(palm_poly, fill=(235, 175, 142, 255))
    
    # 4. Finger bones & joints
    finger_bones = [
        [0, 1, 2, 3, 4],       # Thumb
        [0, 5, 6, 7, 8],       # Index
        [9, 10, 11, 12],       # Middle
        [13, 14, 15, 16],      # Ring
        [17, 18, 19, 20]       # Pinky
    ]
    
    # Draw thicker flesh segments
    for bone_seq in finger_bones:
        for idx in range(len(bone_seq) - 1):
            p1 = pixel_pts[bone_seq[idx]]
            p2 = pixel_pts[bone_seq[idx+1]]
            # Width tapers toward tip
            w = 32 - idx * 4
            draw.line([(p1[0], p1[1]), (p2[0], p2[1])], fill=(238, 178, 145, 255), width=int(w))
            draw.ellipse([p2[0]-w/2, p2[1]-w/2, p2[0]+w/2, p2[1]+w/2], fill=(238, 178, 145, 255))
            
    # Draw fingertip pads
    tips = [4, 8, 12, 16, 20]
    for t in tips:
        pt = pixel_pts[t]
        draw.ellipse([pt[0]-10, pt[1]-10, pt[0]+10, pt[1]+10], fill=(245, 190, 160, 255))
        # subtle fingernail
        draw.ellipse([pt[0]-5, pt[1]-6, pt[0]+5, pt[1]+4], fill=(255, 220, 200, 180))

    # Apply overlay onto background
    bg.paste(overlay, (0, 0), overlay)
    
    # Add Biometric Skeleton Lines & Nodes Overlay (Cybernetic Hologram)
    hud_overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    hud_draw = ImageDraw.Draw(hud_overlay)
    
    for bone_seq in finger_bones:
        for idx in range(len(bone_seq) - 1):
            p1 = pixel_pts[bone_seq[idx]]
            p2 = pixel_pts[bone_seq[idx+1]]
            hud_draw.line([(p1[0], p1[1]), (p2[0], p2[1])], fill=(0, 242, 254, 140), width=2)
            
    for pt in pixel_pts:
        hud_draw.ellipse([pt[0]-4, pt[1]-4, pt[0]+4, pt[1]+4], fill=(0, 242, 254, 255))
        hud_draw.ellipse([pt[0]-2, pt[1]-2, pt[0]+2, pt[1]+2], fill=(255, 255, 255, 255))
        
    bg.paste(hud_overlay, (0, 0), hud_overlay)
    return bg

os.makedirs("scratch", exist_ok=True)
for s in ["hello", "yes", "water", "doctor"]:
    img = render_sign_image(s, s.upper())
    img.save(f"scratch/{s}_test.jpg", quality=95)
print("Rendered 4 test signs successfully!")
