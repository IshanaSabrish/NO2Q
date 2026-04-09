import requests
from app.core.config import settings

class TelegramService:
    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.api_url = f"https://api.telegram.org/bot{self.token}/sendMessage"

    def send_message(self, chat_id: str, text: str):
        if not self.token or "your_" in self.token:
            print(f"--- TELEGRAM MOCK TO {chat_id} ---")
            print(f"Message: {text}")
            print("--------------------------------")
            return True
            
        try:
            res = requests.post(self.api_url, json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            })
            return res.status_code == 200
        except Exception as e:
            print(f"Telegram error: {e}")
            return False

telegram_service = TelegramService()
