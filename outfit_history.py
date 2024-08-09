import json
from datetime import datetime


class OutfitHistory:
    def __init__(self, file_path="outfit_history.json"):
        # Initialize the OutfitHistory class with a file path for storing outfit history
        self.file_path = file_path
        self.history = self.load_history()

    def load_history(self):
        # Attempt to load existing outfit history from the JSON file
        try:
            with open(self.file_path, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # If file doesn't exist or is invalid JSON, return an empty list
            return []

    def save_history(self):
        # Save the current outfit history to the JSON file
        with open(self.file_path, "w") as f:
            json.dump(self.history, f, indent=2)

    def add_outfit(self, user_input, ai_response):
        # Add a new outfit entry to the history
        outfit = {
            "date": datetime.now().isoformat(),  # Use ISO format for date/time
            "user_input": user_input,
            "ai_response": ai_response,
        }
        self.history.append(outfit)
        self.save_history()  # Save after adding new outfit

    def get_all_outfits(self):
        # Retrieve all outfits, sorted by date in descending order (newest first)
        return sorted(self.history, key=lambda x: x["date"], reverse=True)

    def get_recent_outfits(self, limit=5):
        all_outfits = self.get_all_outfits()
        return all_outfits[:limit]

    def delete_outfit(self, date, index):
        # Delete a specific outfit entry based on date and index
        for i, outfit in enumerate(self.history):
            if outfit["date"].startswith(date) and i == index:
                del self.history[i]
                self.save_history()  # Save after deleting outfit
                return True
        return False  # Return False if outfit not found

    def clear_history(self):
        # Clear all outfit history
        self.history = []
        self.save_history()  # Save empty history
