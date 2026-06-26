import mysql.connector
from mysql.connector import pooling
from mysql.connector.constants import ClientFlag
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
    # Sem essa flag, o MySQL conta em UPDATE apenas as linhas cujo valor
    # realmente mudou. Isso faz cursor.rowcount voltar 0 quando o usuario
    # salva o formulario sem alterar nenhum campo (ou o valor enviado e
    # igual ao que ja estava salvo), mesmo o evento existindo e sendo do
    # usuario certo. Com FOUND_ROWS, rowcount passa a refletir as linhas
    # que combinaram com o WHERE, que e o que o codigo realmente precisa
    # para diferenciar "nao encontrado/sem permissao" de "nada mudou".
    client_flags=[ClientFlag.FOUND_ROWS],
)


def get_connection():
    return _pool.get_connection()