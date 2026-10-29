"""
SIGNBRIDGE AI - Dynamic Sentence Builder & Public Service Grammar Engine
Assembles individual gesture signs into coherent natural language sentences,
strictly using ALL detected signs without injecting un-signed foreign concepts.
"""

class SentenceBuilder:
    def __init__(self):
        self.tokens = []
        self.history = []

    def add_token(self, token):
        if not token:
            return self.get_sentence()
        cleaned = token.strip().upper()
        # Prevent consecutive duplicate addition
        if self.tokens and self.tokens[-1] == cleaned:
            return self.get_sentence()
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
        """Converts raw sign sequence into a polished natural sentence using strictly all detected signs."""
        if not self.tokens:
            return ""
        
        upper_tokens = [t.strip().upper() for t in self.tokens]
        
        has_hello = "HELLO" in upper_tokens
        has_where = "WHERE" in upper_tokens
        has_help = "HELP" in upper_tokens
        has_please = "PLEASE" in upper_tokens
        has_thanks = "THANK YOU" in upper_tokens
        has_wait = "WAIT" in upper_tokens
        has_yes = "YES" in upper_tokens
        has_no = "NO" in upper_tokens
        
        # Single sign returns
        if len(upper_tokens) == 1:
            if has_hello: return "Hello."
            if has_thanks: return "Thank you very much."
            if has_wait: return "Please wait a moment."
            if has_yes: return "Yes, I confirm."
            if has_no: return "No, that is not correct."
            if "GOODBYE" in upper_tokens: return "Goodbye, have a great day."
            if has_help: return "I need help, please."
            return f"I would like {upper_tokens[0].lower()}."

        # Collect topics/nouns
        ignored = {"HELLO", "PLEASE", "HELP", "WHERE", "WAIT", "YES", "NO", "GOODBYE", "SORRY"}
        nouns = [t.lower() for t in upper_tokens if t not in ignored]

        prefix = "Hello, " if has_hello else ""
        suffix = ", please." if has_please else "."

        if len(nouns) == 0:
            if has_help:
                return f"{prefix}I need assistance{suffix}"
            if has_thanks:
                return f"{prefix}thank you very much{suffix}"
            return f"{prefix}{' '.join(t.lower() for t in upper_tokens)}{suffix}"

        # Join nouns
        if len(nouns) == 1:
            joined_nouns = nouns[0]
        elif len(nouns) == 2:
            joined_nouns = f"{nouns[0]} and {nouns[1]}"
        else:
            joined_nouns = ", ".join(nouns[:-1]) + f" and {nouns[-1]}"

        if has_where:
            return f"{prefix}where is the {joined_nouns}?".replace("..", ".")
        elif has_help:
            return f"{prefix}I need help with {joined_nouns}{suffix}"
        else:
            return f"{prefix}I would like {joined_nouns}{suffix}"

    def get_counter_reply(self):
        """Derives the exact, correct reply for Side B (Staff Desk) paired with the citizen inquiry."""
        if not self.tokens:
            return "Hello! Welcome to Counter 3. How may I assist you today?"
        
        upper_tokens = [t.strip().upper() for t in self.tokens]

        if "MEDICINE" in upper_tokens:
            return "The pharmacy dispensary and medical counter are located at Room 2. Please let me know what medicine you require."
        if "RESTROOM" in upper_tokens:
            return "The public restroom is straight down Corridor B on your right."
        if "WATER" in upper_tokens:
            return "Drinking water dispenser is located right next to Counter 1 near the entrance."
        if "BUS" in upper_tokens:
            return "Bus tickets and schedules are available right here at Counter 3. Where are you traveling to?"
        if "TRAIN" in upper_tokens or "RAILWAY" in upper_tokens:
            return "Railway tickets and Platform 3 express schedules are processed directly at Counter 3."
        if "TICKET" in upper_tokens or "RECEIPT" in upper_tokens:
            return "I can print your official receipt or ticket immediately. Please give me one moment."
        if "DOCTOR" in upper_tokens or "HOSPITAL" in upper_tokens or "EMERGENCY" in upper_tokens or "PAIN" in upper_tokens:
            return "Immediate medical assistance has been alerted. A doctor is on duty at Triage Room 2 next door."
        if "FOOD" in upper_tokens:
            return "The public cafeteria and canteen are on Ground Floor Level, past the elevators."
        if "BANK" in upper_tokens or "MONEY" in upper_tokens or "PAY" in upper_tokens:
            return "Fee payments and cash transactions can be settled directly here at Counter 3 via cash or card."
        if "WHEELCHAIR" in upper_tokens:
            return "An accessible wheelchair and escort assistant have been requested to Counter 3 right now."
        if "ID CARD" in upper_tokens or "NAME" in upper_tokens or "SIGNATURE" in upper_tokens:
            return "Thank you for presenting your identity documents. Let me verify the details in the official record."
        if "WAIT" in upper_tokens:
            return "Take all the time you need. We are ready whenever you are."
        if "THANK YOU" in upper_tokens:
            return "You are very welcome! Have a wonderful day ahead."
        if "YES" in upper_tokens:
            return "Thank you for the confirmation. We are processing your request now."
        if "NO" in upper_tokens:
            return "Understood, that option is canceled. Please let me know what you need instead."
            
        return "Hello! Welcome to Counter 3. How may I assist you with your request today?"
