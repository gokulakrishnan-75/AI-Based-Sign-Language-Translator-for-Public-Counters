"""
Test script to generate realistic photo composites for sign language signs.
"""
import os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

WIDTH = 1200
HEIGHT = 896

def create_studio_background(spot_center=(600, 380), spot_radius=500):
    y, x = np.ogrid[:HEIGHT, :WIDTH]
    dist = np.sqrt((x - spot_center[0])**2 + (y - spot_center[1])**2)
    t = np.clip(dist / spot_radius, 0, 1)
    
    # Smooth cosine falloff
    falloff = (1.0 - np.cos(t * np.pi)) / 2.0
    
    # Center color: [16, 36, 56], Edge color: [4, 11, 18]
    r = (16 * (1 - falloff) + 4 * falloff).astype(np.float32)
    g = (36 * (1 - falloff) + 11 * falloff).astype(np.float32)
    b = (56 * (1 - falloff) + 18 * falloff).astype(np.float32)
    
    # Add subtle photographic sensor grain
    np.random.seed(42)
    noise = np.random.normal(0, 1.2, (HEIGHT, WIDTH))
    r = np.clip(r + noise, 0, 255)
    g = np.clip(g + noise, 0, 255)
    b = np.clip(b + noise, 0, 255)
    
    bg_arr = np.stack([r, g, b], axis=-1).astype(np.uint8)
    return Image.fromarray(bg_arr, mode='RGB')

def extract_hand_rgba(img_path, threshold=28, feather=3):
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img, dtype=np.float32)
    
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    # Sample background color in corner
    bg_r = arr[:20, :20, 0].mean()
    bg_g = arr[:20, :20, 1].mean()
    bg_b = arr[:20, :20, 2].mean()
    
    diff = np.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
    
    # Clean alpha ramp
    alpha = np.clip((diff - threshold) / (threshold * 0.8 + 1), 0, 1)
    
    # Morphological clean up
    mask = Image.fromarray((alpha * 255).astype(np.uint8))
    mask = mask.filter(ImageFilter.GaussianBlur(radius=feather))
    
    rgba = img.convert('RGBA')
    rgba.putalpha(mask)
    return rgba

print("Helper functions defined successfully")
