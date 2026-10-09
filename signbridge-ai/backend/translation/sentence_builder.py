"""
SIGNBRIDGE AI - Natural Sentence Builder & Public Service Grammar Engine
Assembles individual gesture signs into coherent natural language sentences,
supports undo, clear, punctuation formatting, and counter-ready speech phrasing.
"""

class SentenceBuilder:
    def __init__(self):
        self.tokens = []
        self.history = []

    def add_token(self, token):
        if not token:
            return self.get_sentence()
        cleaned = token.strip().upper()
        self.tokens.append(cleaned)
        self.history.append(list(self.tokens))
        return self.get_sentence()

    def undo(self):
        if self.tokens:
            self.tokens.pop()
        return self.get_sentence()

    def clear(self):
        self.tokens.clear()
        self.history.clear()
        return ""

    def get_tokens(self):
        return list(self.tokens)

    def get_sentence(self):
        if not self.tokens:
            return ""
        return " ".join(self.tokens)

    def get_spoken_text(self):
        """Converts raw sign sequence into a polished natural sentence for Text-to-Speech."""
        if not self.tokens:
            return ""
        
        raw = " ".join(self.tokens).title()
        
        # Public counter context mappings
        mappings = {
            "Hello Help": "Hello, I need assistance please.",
            "Hello I Need Help": "Hello, I need assistance please.",
            "Water Please": "Could I please get some drinking water?",
            "Where Restroom": "Excuse me, where is the restroom located?",
            "Where Hospital": "Where is the nearest hospital or medical counter?",
            "Where Bank": "Where is the banking or payment counter?",
            "Ticket Railway": "I would like to inquire about a railway ticket.",
            "Help Emergency": "Emergency! I need immediate help!",
            "Thank You": "Thank you very much for your help.",
            "Please Wait": "Please wait a moment while I get my documents ready.",
            "Doctor Please": "I need to see a doctor or medical officer, please."
        }
        
        for phrase, expansion in mappings.items():
            if raw.upper() == phrase.upper():
                return expansion
                
        # Default fallback: capitalized sentence with period
        return raw + "."
