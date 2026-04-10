import os
from dotenv import load_dotenv

root_dir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(root_dir, '.env'))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-me')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'change-me-jwt')
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '12345678')
    DB_NAME = os.getenv('DB_NAME', 'eventocom')
    DB_POOL_SIZE = int(os.getenv('DB_POOL_SIZE', 5))
