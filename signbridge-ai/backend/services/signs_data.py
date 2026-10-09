"""
SIGNBRIDGE AI - Supported Signs Catalog & Centralized Configuration
Comprehensive public service, emergency, transport, banking, and medical signs.
"""

SUPPORTED_SIGNS = [
    {
        "id": "hello",
        "name": "HELLO",
        "meaning": "Universal greeting / initiating communication",
        "category": "Greetings",
        "description": "Open hand facing forward, upright fingers held together or slight side-to-side greeting motion.",
        "icon": "/signs/hello.svg",
        "class_id": 0,
        "supported": True,
        "sampleCount": 180
    },
    {
        "id": "thank_you",
        "name": "THANK YOU",
        "meaning": "Expression of gratitude and appreciation",
        "category": "Basic Communication",
        "description": "Flat hand with palm facing inward touching chin/lips then moving outward towards staff.",
        "icon": "/signs/thank_you.svg",
        "class_id": 1,
        "supported": True,
        "sampleCount": 175
    },
    {
        "id": "yes",
        "name": "YES",
        "meaning": "Affirmative confirmation or agreement",
        "category": "Basic Communication",
        "description": "Closed fist with upright thumb (thumbs-up gesture) or fist nodding up and down.",
        "icon": "/signs/yes.svg",
        "class_id": 2,
        "supported": True,
        "sampleCount": 190
    },
    {
        "id": "no",
        "name": "NO",
        "meaning": "Negative answer or disagreement",
        "category": "Basic Communication",
        "description": "Index and middle fingers extended horizontally together snapping against thumb.",
        "icon": "/signs/no.svg",
        "class_id": 3,
        "supported": True,
        "sampleCount": 185
    },
    {
        "id": "help",
        "name": "HELP",
        "meaning": "Requesting immediate assistance or aid",
        "category": "Emergency & Assistance",
        "description": "Closed fist with thumb upright placed onto the flat open palm of the opposite hand, rising together.",
        "icon": "/signs/help.svg",
        "class_id": 4,
        "supported": True,
        "sampleCount": 195
    },
    {
        "id": "water",
        "name": "WATER",
        "meaning": "Requesting drinking water or hydration facility",
        "category": "Basic Communication",
        "description": "'W' handshape (index, middle, and ring fingers extended up, thumb on pinky) tapping near mouth.",
        "icon": "/signs/water.svg",
        "class_id": 5,
        "supported": True,
        "sampleCount": 160
    },
    {
        "id": "please",
        "name": "PLEASE",
        "meaning": "Polite request indicator",
        "category": "Basic Communication",
        "description": "Open flat palm facing chest, performing circular rubbing motion over heart.",
        "icon": "/signs/please.svg",
        "class_id": 6,
        "supported": True,
        "sampleCount": 170
    },
    {
        "id": "wait",
        "name": "WAIT",
        "meaning": "Instructing or asking to hold on briefly",
        "category": "Assistance",
        "description": "Open hand with palm facing slightly outward, fingers spread, fingers wiggling gently.",
        "icon": "/signs/wait.svg",
        "class_id": 7,
        "supported": True,
        "sampleCount": 165
    },
    {
        "id": "stop",
        "name": "STOP",
        "meaning": "Halt immediately / cease action",
        "category": "Emergency",
        "description": "Hand held firm, open palm facing directly forward with fingers pointed up like a traffic stop.",
        "icon": "/signs/stop.svg",
        "class_id": 8,
        "supported": True,
        "sampleCount": 185
    },
    {
        "id": "where",
        "name": "WHERE",
        "meaning": "Inquiry regarding location or direction",
        "category": "Questions",
        "description": "Index finger pointing up, waving gently back and forth side-to-side, or open palms facing up questioning.",
        "icon": "/signs/where.svg",
        "class_id": 9,
        "supported": True,
        "sampleCount": 170
    },
    {
        "id": "hospital",
        "name": "HOSPITAL",
        "meaning": "Medical facility / healthcare request",
        "category": "Medical",
        "description": "'H' hand shape (index and middle extended together) drawing a medical cross '+' in the air.",
        "icon": "/signs/hospital.svg",
        "class_id": 10,
        "supported": True,
        "sampleCount": 155
    },
    {
        "id": "bank",
        "name": "BANK",
        "meaning": "Financial counter / banking service",
        "category": "Banking",
        "description": "Hand forming flat money-sliding motion or fingers rubbing thumb in universal cash gesture.",
        "icon": "/signs/bank.svg",
        "class_id": 11,
        "supported": True,
        "sampleCount": 150
    },
    {
        "id": "railway",
        "name": "RAILWAY",
        "meaning": "Train station / railway platform / transit ticket",
        "category": "Railway & Transport",
        "description": "'R' crossed fingers (index and middle fingers crossed) moving horizontally along railway tracks.",
        "icon": "/signs/railway.svg",
        "class_id": 12,
        "supported": True,
        "sampleCount": 145
    },
    {
        "id": "emergency",
        "name": "EMERGENCY",
        "meaning": "Critical situation requiring urgent response",
        "category": "Emergency",
        "description": "'E' handshape (fingertips curled on thumb) shaking rapidly side to side.",
        "icon": "/signs/emergency.svg",
        "class_id": 13,
        "supported": True,
        "sampleCount": 175
    },
    {
        "id": "doctor",
        "name": "DOCTOR",
        "meaning": "Requesting medical officer or physician",
        "category": "Medical",
        "description": "'D' or 'M' fingers tapping on the inner wrist checking pulse.",
        "icon": "/signs/doctor.svg",
        "class_id": 14,
        "supported": True,
        "sampleCount": 140
    },
    {
        "id": "ticket",
        "name": "TICKET",
        "meaning": "Transit, railway, or counter queue ticket",
        "category": "Railway & Transport",
        "description": "Bent index and middle fingers pinching or punching edge of flat non-dominant hand.",
        "icon": "/signs/ticket.svg",
        "class_id": 15,
        "supported": True,
        "sampleCount": 150
    },
    {
        "id": "money",
        "name": "MONEY",
        "meaning": "Cash, payment, fee, or financial transaction",
        "category": "Banking",
        "description": "Tips of thumb and fingers pinched together and rubbed repeatedly.",
        "icon": "/signs/money.svg",
        "class_id": 16,
        "supported": True,
        "sampleCount": 160
    },
    {
        "id": "restroom",
        "name": "RESTROOM",
        "meaning": "Lavatory / washroom / toilet facilities",
        "category": "Government Services",
        "description": "'T' handshape (thumb tucked between index and middle fingers) gently shaking side to side.",
        "icon": "/signs/restroom.svg",
        "class_id": 17,
        "supported": True,
        "sampleCount": 150
    },
    {
        "id": "police",
        "name": "POLICE",
        "meaning": "Security / law enforcement assistance",
        "category": "Government Services",
        "description": "'C' shaped hand placed over upper chest area where badge is worn.",
        "icon": "/signs/police.svg",
        "class_id": 18,
        "supported": True,
        "sampleCount": 145
    },
    {
        "id": "food",
        "name": "FOOD",
        "meaning": "Meal / eating / canteen / food service",
        "category": "Basic Communication",
        "description": "Fingertips gathered together with thumb (squashed O-shape), tapping against lips.",
        "icon": "/signs/food.svg",
        "class_id": 19,
        "supported": True,
        "sampleCount": 155
    },
    # Expanded Public Service Signs (20-35)
    {
        "id": "goodbye",
        "name": "GOODBYE",
        "meaning": "Parting salutation / concluding transaction",
        "category": "Greetings",
        "description": "Open hand held upright, fingers closing and opening smoothly in parting farewell gesture.",
        "icon": "/signs/goodbye.svg",
        "class_id": 20,
        "supported": True,
        "sampleCount": 160
    },
    {
        "id": "sorry",
        "name": "SORRY",
        "meaning": "Apology or regret expression",
        "category": "Basic Communication",
        "description": "'A' closed fist rubbed in circular motion clockwise over chest heart area.",
        "icon": "/signs/sorry.svg",
        "class_id": 21,
        "supported": True,
        "sampleCount": 165
    },
    {
        "id": "name",
        "name": "NAME",
        "meaning": "Citizen identity / inquiry about name",
        "category": "Questions",
        "description": "'H' shape (index and middle fingers extended) tapping crosswise on opposite hand's 'H' fingers.",
        "icon": "/signs/name.svg",
        "class_id": 22,
        "supported": True,
        "sampleCount": 150
    },
    {
        "id": "id_card",
        "name": "ID CARD",
        "meaning": "Government identification pass or credential",
        "category": "Government Services",
        "description": "'I' handshape tapping against flat open palm, representing an official credential badge.",
        "icon": "/signs/id_card.svg",
        "class_id": 23,
        "supported": True,
        "sampleCount": 155
    },
    {
        "id": "medicine",
        "name": "MEDICINE",
        "meaning": "Pharmaceutical prescription / medication",
        "category": "Medical",
        "description": "Middle finger bent downward and swiveled in palm of other hand (mortar and pestle gesture).",
        "icon": "/signs/medicine.svg",
        "class_id": 24,
        "supported": True,
        "sampleCount": 150
    },
    {
        "id": "bus",
        "name": "BUS",
        "meaning": "Public bus transit / city bus stand",
        "category": "Railway & Transport",
        "description": "Hands mimicking holding and turning a large horizontal bus steering wheel.",
        "icon": "/signs/bus.svg",
        "class_id": 25,
        "supported": True,
        "sampleCount": 145
    },
    {
        "id": "time",
        "name": "TIME",
        "meaning": "Clock inquiry / schedule / appointment time",
        "category": "Questions",
        "description": "Index finger gently tapping twice on the wrist watch position of opposite arm.",
        "icon": "/signs/time.svg",
        "class_id": 26,
        "supported": True,
        "sampleCount": 160
    },
    {
        "id": "pay",
        "name": "PAY",
        "meaning": "Discharge payment / cash fee settlement",
        "category": "Banking",
        "description": "Index finger flicking forward from palm, indicating transferring payment to clerk.",
        "icon": "/signs/pay.svg",
        "class_id": 27,
        "supported": True,
        "sampleCount": 155
    },
    {
        "id": "receipt",
        "name": "RECEIPT",
        "meaning": "Official receipt, payment token, or invoice",
        "category": "Banking",
        "description": "Pinching thumb and index sliding along edge of flat non-dominant palm like tearing slip.",
        "icon": "/signs/receipt.svg",
        "class_id": 28,
        "supported": True,
        "sampleCount": 140
    },
    {
        "id": "form",
        "name": "FORM",
        "meaning": "Application form / declaration document",
        "category": "Government Services",
        "description": "Hands framing a rectangular paper document outline in the air.",
        "icon": "/signs/form.svg",
        "class_id": 29,
        "supported": True,
        "sampleCount": 150
    },
    {
        "id": "signature",
        "name": "SIGNATURE",
        "meaning": "Signing name / official document sign-off",
        "category": "Government Services",
        "description": "Fingers held like a pen sliding in signature scribble motion across flat palm.",
        "icon": "/signs/signature.svg",
        "class_id": 30,
        "supported": True,
        "sampleCount": 145
    },
    {
        "id": "call",
        "name": "CALL",
        "meaning": "Phone call / contact guardian or official",
        "category": "Emergency & Assistance",
        "description": "'Y' handshape (thumb and pinky extended) held to ear and mouth in telephone pose.",
        "icon": "/signs/call.svg",
        "class_id": 31,
        "supported": True,
        "sampleCount": 170
    },
    {
        "id": "pain",
        "name": "PAIN",
        "meaning": "Physical hurt / medical distress location",
        "category": "Medical",
        "description": "Both index fingers pointing towards each other and twisting inward sharply.",
        "icon": "/signs/pain.svg",
        "class_id": 32,
        "supported": True,
        "sampleCount": 160
    },
    {
        "id": "wheelchair",
        "name": "WHEELCHAIR",
        "meaning": "Ramp access / mobility assistance",
        "category": "Assistance",
        "description": "Hands held at sides with fingers curled in circular wheel-rolling motion.",
        "icon": "/signs/wheelchair.svg",
        "class_id": 33,
        "supported": True,
        "sampleCount": 150
    },
    {
        "id": "deaf",
        "name": "DEAF",
        "meaning": "Deaf citizen / sign language preference",
        "category": "Assistance",
        "description": "Index finger touching ear and then mouth, indicating deaf or non-verbal citizen.",
        "icon": "/signs/deaf.svg",
        "class_id": 34,
        "supported": True,
        "sampleCount": 165
    },
    {
        "id": "train",
        "name": "TRAIN",
        "meaning": "Express train / railway coach / rail transit",
        "category": "Railway & Transport",
        "description": "Two fingers of right hand rubbing back and forth across two fingers of left hand along tracks.",
        "icon": "/signs/train.svg",
        "class_id": 35,
        "supported": True,
        "sampleCount": 155
    }
]

CLASS_TO_SIGN = {sign["class_id"]: sign["name"] for sign in SUPPORTED_SIGNS}
SIGN_TO_CLASS = {sign["name"]: sign["class_id"] for sign in SUPPORTED_SIGNS}
ID_TO_SIGN = {sign["id"]: sign for sign in SUPPORTED_SIGNS}
