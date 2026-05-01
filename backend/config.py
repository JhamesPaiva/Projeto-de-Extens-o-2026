import os
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(root_dir, '.env'))


def _is_weak_secret(value: str) -> bool:
    if not value:
        return True
    normalized = value.strip().lower()
    weak_values = {
        'change-me',
        'change-me-jwt',
        'changeme',
        'secret',
        'default',
        'password',
    }
    return normalized in weak_values or len(value) < 32


def _is_production_environment() -> bool:
    flask_env = os.getenv('FLASK_ENV', '').strip().lower()
    app_env = os.getenv('APP_ENV', '').strip().lower()
    return flask_env == 'production' or app_env == 'production'


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-me')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'change-me-jwt')
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '12345678')
    DB_NAME = os.getenv('DB_NAME', 'eventocom')
    DB_POOL_SIZE = int(os.getenv('DB_POOL_SIZE', 15))

    @classmethod
    def validate_security(cls):
        weak_secret_key = _is_weak_secret(cls.SECRET_KEY)
        weak_jwt_secret = _is_weak_secret(cls.JWT_SECRET_KEY)
        strict_validation = os.getenv('STRICT_SECRET_VALIDATION', 'false').strip().lower() in {'1', 'true', 'yes'}

        if weak_secret_key or weak_jwt_secret:
            if _is_production_environment() or strict_validation:
                raise RuntimeError(
                    'Invalid SECRET_KEY/JWT_SECRET_KEY: configure strong values (at least 32 chars) in backend/.env or environment variables.'
                )
