import os

SIGNS = [
    ("hello", "HELLO", "Open Hand Wave", "M12 4v8 M8 6v6 M16 6v6 M20 8v5 M4 9v6 M7 18h10c2 0 3-1 3-3V12 M7 18l-3-4"),
    ("thank_you", "THANK YOU", "Vertical Blade at Chin", "M12 6c-2 0-3 2-3 4v4 M12 6c2 0 3 2 3 4v4 M9 18l3 3 6-6 M12 14v7"),
    ("yes", "YES", "Left Hand Thumbs Up", "M9 10h6v8H9z M9 10V6a2 2 0 0 1 4 0v4 M12 18v2"),
    ("no", "NO", "Snap Fingers to Thumb", "M8 8l8 8 M16 8l-8 8 M7 12h10"),
    ("help", "HELP", "Horizontal Palm Thumb Up", "M5 19h14 M12 15V8a2 2 0 0 1 4 0v7 M8 12h8 M12 4l-2 2h4z"),
    ("water", "WATER", "W Shape Tap", "M6 6l3 12 3-8 3 8 3-12 M12 2v2"),
    ("please", "PLEASE", "Fist with Pinky Up", "M12 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0 M12 9l2 3-2 3"),
    ("wait", "WAIT", "Firm Joined Palm", "M6 8v6 M9 6v8 M12 5v9 M15 6v8 M18 8v6 M6 14c0 3 2.5 5 6 5s6-2 6-5"),
    ("where", "WHERE", "Questioning Index Pointer", "M12 4v10 M9 14h6v6H9z"),
    ("hospital", "HOSPITAL", "Medical 'H' Handshape", "M12 5v14 M5 12h14"),
    ("bank", "BANK", "B Handshape Thumb Folded", "M6 8h12v8H6z M12 10v4 M10 12h4"),
    ("railway", "RAILWAY", "R Crossed Fingers Track", "M5 7l14 10 M5 17L19 7 M8 9l8 6"),
    ("emergency", "EMERGENCY", "E Handshape Alert", "M12 4l8 14H4z M12 9v4 M12 15h.01"),
    ("doctor", "DOCTOR", "D Handshape Physician", "M4 14h16 M10 10l2 4 3-6 2 2"),
    ("ticket", "TICKET", "X Bent Hook Clip", "M6 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z M10 7v10"),
    ("money", "MONEY", "Thumb-Finger Rub", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 11v2 M11 12h2"),
    ("restroom", "RESTROOM", "Service Sign 'T'", "M6 6h12 M12 6v12 M9 18h6"),
    ("police", "POLICE", "C Shield / Badge", "M12 4L5 7v6c0 5 4 8 7 9 3-1 7-4 7-9V7z"),
    ("food", "FOOD", "Tapered Cluster to Lips", "M12 15c-3 0-5-2-5-5a5 5 0 0 1 10 0c0 3-2 5-5 5z M12 6v4"),
    ("goodbye", "GOODBYE", "Farewell Waving Hand", "M12 4v8 M8 6v6 M16 6v6 M4 8l16 0 M7 18h10"),
    ("sorry", "SORRY", "A Fist Heart Circular", "M12 8c2-2 5-1 5 2 0 4-5 8-5 8s-5-4-5-8c0-3 3-4 5-2z"),
    ("name", "NAME", "V Peace Sign Identity", "M7 8h10 M7 16h10 M12 5v14"),
    ("id_card", "ID CARD", "L Frame Credential", "M4 5h16v14H4z M8 9h8 M8 13h5"),
    ("medicine", "MEDICINE", "Pestle Medication Motion", "M6 10a6 6 0 0 0 12 0H6z M12 4v6 M10 4h4"),
    ("bus", "BUS", "Steering Claw Grip", "M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0 M12 4v16 M4 12h16"),
    ("time", "TIME", "Index Wristwatch Tap", "M12 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0 M12 8v4l3 3 M9 2h6 M9 22h6"),
    ("pay", "PAY", "Forward Delivery Handover", "M5 12h14 M14 7l5 5-5 5"),
    ("receipt", "RECEIPT", "Pinch Token Slip", "M6 4h12l-2 16H8z M9 9h6 M9 13h4"),
    ("form", "FORM", "Corner Boundary Outline", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"),
    ("signature", "SIGNATURE", "Pen Writing Grip", "M4 18c4-4 8 2 12-4 M16 10l3-3 2 2-3 3z"),
    ("call", "CALL", "Y Telephone Hand Shape", "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"),
    ("pain", "PAIN", "Inward Pain Pointer", "M4 12h6 M14 12h6 M8 9l3 3-3 3 M16 9l-3 3 3 3"),
    ("wheelchair", "WHEELCHAIR", "Wheel Push Claw", "M9 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M11 8v5l4 3 M7 18a5 5 0 1 0 10 0"),
    ("deaf", "DEAF", "Ear to Mouth Touch", "M7 8a4 4 0 0 1 8 0c0 3-2 5-4 6v2 M12 18h.01"),
    ("train", "TRAIN", "Two-Finger Forward Track", "M6 4h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M8 18l-2 3 M16 18l2 3 M9 8h6")
]

TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 220" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-{id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1226"/>
      <stop offset="100%" stop-color="#070B16"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
    <filter id="glow-{id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Card Background -->
  <rect width="280" height="220" rx="16" fill="url(#bg-{id})" stroke="#1E2D4F" stroke-width="1.5"/>
  <rect x="1" y="1" width="278" height="218" rx="15" fill="none" stroke="rgba(0, 242, 254, 0.15)" stroke-width="1"/>
  
  <!-- Subtle Grid Pattern -->
  <path d="M 20 0 L 20 220 M 60 0 L 60 220 M 100 0 L 100 220 M 140 0 L 140 220 M 180 0 L 180 220 M 220 0 L 220 220 M 260 0 L 260 220 M 0 40 L 280 40 M 0 80 L 280 80 M 0 120 L 280 120 M 0 160 L 280 160 M 0 200 L 280 200" stroke="#0E1933" stroke-width="0.8" opacity="0.6"/>

  <!-- AI Biometric Landmark Target Circle -->
  <circle cx="140" cy="95" r="48" fill="#0D1933" stroke="#00F2FE" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.4"/>
  <circle cx="140" cy="95" r="38" fill="rgba(0, 242, 254, 0.04)"/>
  
  <!-- Corner Tech Accents -->
  <path d="M 12 24 L 12 12 L 24 12" fill="none" stroke="#00F2FE" stroke-width="1.5" opacity="0.5"/>
  <path d="M 268 24 L 268 12 L 256 12" fill="none" stroke="#00F2FE" stroke-width="1.5" opacity="0.5"/>

  <!-- Gesture Vector Icon -->
  <g transform="translate(140, 95) scale(2.6) translate(-12, -12)" filter="url(#glow-{id})">
    <path d="{path}" fill="none" stroke="url(#cyanGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Landmark Nodes Simulation -->
  <circle cx="120" cy="80" r="2.5" fill="#00F2FE"/>
  <circle cx="140" cy="65" r="2.5" fill="#00F2FE"/>
  <circle cx="160" cy="80" r="2.5" fill="#00F2FE"/>
  <circle cx="140" cy="125" r="2.5" fill="#38BDF8"/>
  <line x1="120" y1="80" x2="140" y2="65" stroke="rgba(0,242,254,0.4)" stroke-width="1"/>
  <line x1="140" y1="65" x2="160" y2="80" stroke="rgba(0,242,254,0.4)" stroke-width="1"/>

  <!-- Text Label & Subtitle -->
  <text x="140" y="174" font-family="'Inter', sans-serif" font-weight="700" font-size="14" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">{name}</text>
  <text x="140" y="194" font-family="'Inter', sans-serif" font-weight="400" font-size="10.5" fill="#94A3B8" text-anchor="middle">{desc}</text>
</svg>
"""

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, ".."))

dest_dirs = [
    os.path.join(project_root, "frontend", "public", "signs"),
    os.path.join(project_root, "frontend", "dist", "signs"),
    os.path.join(project_root, "assets", "signs")
]

for d in dest_dirs:
    os.makedirs(d, exist_ok=True)
    for sign_id, name, desc, path in SIGNS:
        svg_content = TEMPLATE.format(id=sign_id, name=name, desc=desc, path=path)
        with open(os.path.join(d, f"{sign_id}.svg"), "w", encoding="utf-8") as f:
            f.write(svg_content)

print(f"Generated {len(SIGNS)} SVG sign illustrations across {len(dest_dirs)} locations.")
