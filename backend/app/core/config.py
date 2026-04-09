from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NO2Q+"
    SECRET_KEY: str = "supersecretkey_for_no2q"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 1 day
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "no2q_db"
    
    # Twilio Configuration (Optional - falls back to console mock)
    TWILIO_ACCOUNT_SID: str = "your_twilio_sid"
    TWILIO_AUTH_TOKEN: str = "your_twilio_token"
    TWILIO_PHONE_NUMBER: str = "+1234567890"

    # Telegram Configuration (Free Alternative)
    TELEGRAM_BOT_TOKEN: str = "your_telegram_bot_token"

    # Grace period settings (in seconds)
    GRACE_PERIOD_TOTAL: int = 1200  # 20 minutes total
    GRACE_WARNING_INTERVAL: int = 300  # 5 minute warnings
    GRACE_MOVE_DOWN_AFTER: int = 600  # Move down after 10 mins
    GRACE_CANCEL_AFTER: int = 1200  # Cancel after 20 mins

    # Average dining time per person (minutes) for wait estimation
    AVG_DINING_TIME_MINS: int = 15

    class Config:
        env_file = ".env"

settings = Settings()
