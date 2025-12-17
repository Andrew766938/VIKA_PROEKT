import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Основные параметры
    SECRET_KEY: str = "your-secret-key-change-in-production-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DB_NAME: str = "restaurant.db"
    DATABASE_URL: str = "sqlite:///restaurant.db"
    
    # Конфигурация для загрузки из .env файла
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"),
        env_file_encoding='utf-8',
        case_sensitive=False
    )
    
    @property
    def get_db_url(self):
        return f"sqlite:///{self.DB_NAME}"

    @property
    def auth_data(self):
        return {"secret_key": self.SECRET_KEY, "algorithm": self.ALGORITHM}


settings = Settings()

# Выводим конфигурацию при загрузке (для дебага)
if __name__ == "__main__":
    print(f"Database URL: {settings.get_db_url}")
    print(f"Algorithm: {settings.ALGORITHM}")
    print(f"Token Expire: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
