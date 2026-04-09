from app.core.config import settings
import random

class SMSService:
    def __init__(self):
        self.mode = "mock"
        try:
            if settings.TWILIO_ACCOUNT_SID and "your_" not in settings.TWILIO_ACCOUNT_SID:
                from twilio.rest import Client
                self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                self.from_phone = settings.TWILIO_PHONE_NUMBER
                self.mode = "production"
            else:
                print("⚠️  TWILIO KEYS NOT CONFIGURED: Running in Developer Mode (Logging to Console)")
        except ImportError:
            print("⚠️  Twilio not installed. Running in mock mode. Install with: pip install twilio")
        except Exception:
            self.mode = "mock"

    def send_sms(self, to_phone: str, message: str):
        if self.mode == "mock":
            print("\n" + "=" * 60)
            print(f"📱  MOCK SMS TO: {to_phone}")
            print(f"💬  MESSAGE: {message}")
            print("=" * 60 + "\n")
            return True

        try:
            self.client.messages.create(
                body=message,
                from_=self.from_phone,
                to=to_phone
            )
            return True
        except Exception as e:
            print(f"Error sending SMS: {e}")
            # Fallback to mock
            print(f"📱  FALLBACK MOCK SMS TO: {to_phone}")
            print(f"💬  MESSAGE: {message}")
            return True

    def send_otp_sms(self, to_phone: str, otp: str):
        """Send OTP verification message"""
        message = f"Your NO2Q+ verification code is: {otp}. Do not share this with anyone."
        return self.send_sms(to_phone, message)
    
    def send_token_created(self, to_phone: str, name: str, token_number: str, estimated_mins: int, track_url: str):
        """Send token creation confirmation"""
        message = (
            f"Welcome {name}! 🎉\n"
            f"Your NO2Q+ token: {token_number}\n"
            f"Estimated wait: {estimated_mins} mins\n"
            f"Track live: {track_url}"
        )
        return self.send_sms(to_phone, message)
    
    def send_table_ready(self, to_phone: str, name: str, token_number: str):
        """Send table ready notification"""
        message = (
            f"🔔 {name}, your table is ready!\n"
            f"Token: {token_number}\n"
            f"Please come to the restaurant entrance."
        )
        return self.send_sms(to_phone, message)
    
    def send_five_min_warning(self, to_phone: str, name: str):
        """Send 5 minute warning before grace period expires"""
        message = (
            f"⏳ {name}, your table is waiting!\n"
            f"Please arrive within 5 minutes to keep your spot."
        )
        return self.send_sms(to_phone, message)
    
    def send_moved_down(self, to_phone: str, name: str):
        """Notify customer they've been moved down in queue"""
        message = (
            f"⚠️ {name}, you didn't arrive on time.\n"
            f"You've been moved down in the queue. Please come soon."
        )
        return self.send_sms(to_phone, message)
    
    def send_token_cancelled(self, to_phone: str, name: str, token_number: str):
        """Notify customer their token was cancelled"""
        message = (
            f"❌ {name}, your token {token_number} has been cancelled.\n"
            f"You didn't arrive within the grace period. Please book again if needed."
        )
        return self.send_sms(to_phone, message)
    
    def send_dining_started(self, to_phone: str, name: str, table_number: int):
        """Notify customer dining has started"""
        message = (
            f"🍽️ Enjoy your meal, {name}!\n"
            f"You've been assigned Table {table_number}. Have a great dining experience!"
        )
        return self.send_sms(to_phone, message)

sms_service = SMSService()
