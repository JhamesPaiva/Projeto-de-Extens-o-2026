import mysql.connector
from mysql.connector import pooling
from config import Config

_pool = pooling.MySQLConnectionPool(
    pool_name='eventocom_pool',
    pool_size=Config.DB_POOL_SIZE,
    host=Config.DB_HOST,
    port=Config.DB_PORT,
    user=Config.DB_USER,
    password=Config.DB_PASSWORD,
    database=Config.DB_NAME,
    charset='utf8mb4',
    collation='utf8mb4_unicode_ci',
)


def get_connection():
    return _pool.get_connection()
