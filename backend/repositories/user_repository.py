from werkzeug.security import generate_password_hash

from database import get_connection
from models import User
from repositories.base import close_cursor_and_conn


def ensure_users_avatar_column(conn):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            '''
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'avatar_data'
            LIMIT 1
            '''
        )
        exists = cursor.fetchone()
    finally:
        cursor.close()

    if exists:
        return

    alter_cursor = conn.cursor()
    try:
        alter_cursor.execute('ALTER TABLE users ADD COLUMN avatar_data MEDIUMTEXT NULL')
        conn.commit()
    finally:
        alter_cursor.close()


def create_user_record(**payload):
    senha_hash = generate_password_hash(payload['senha'])
    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            INSERT INTO users (nome, email, senha_hash, tipo, cpf, cnpj, telefone, cep, cidade, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            (
                payload['nome'],
                payload['email'],
                senha_hash,
                payload['tipo'],
                payload.get('cpf'),
                payload.get('cnpj'),
                payload.get('telefone'),
                payload.get('cep'),
                payload.get('cidade'),
                payload.get('estado'),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        close_cursor_and_conn(cursor, conn)


def find_user_by_email_record(email):
    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
        row = cursor.fetchone()
        return User(row) if row else None
    finally:
        close_cursor_and_conn(cursor, conn)


def get_user_by_id_record(user_id):
    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
        row = cursor.fetchone()
        return User(row) if row else None
    finally:
        close_cursor_and_conn(cursor, conn)


def update_user_profile_record(user_id, **payload):
    fields = []
    params = []
    if payload.get('nome') is not None:
        fields.append('nome = %s')
        params.append(payload.get('nome'))
    if payload.get('telefone') is not None:
        fields.append('telefone = %s')
        params.append(payload.get('telefone'))
    if payload.get('cep') is not None:
        fields.append('cep = %s')
        params.append(payload.get('cep'))
    if payload.get('cidade') is not None:
        fields.append('cidade = %s')
        params.append(payload.get('cidade'))
    if payload.get('estado') is not None:
        fields.append('estado = %s')
        params.append(payload.get('estado'))
    if payload.get('cpf') is not None:
        fields.append('cpf = %s')
        params.append(payload.get('cpf'))
    if payload.get('cnpj') is not None:
        fields.append('cnpj = %s')
        params.append(payload.get('cnpj'))

    if not fields:
        return False

    params.append(user_id)
    sql = f"UPDATE users SET {', '.join(fields)} WHERE id = %s"
    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(sql, tuple(params))
        conn.commit()
        return True
    finally:
        close_cursor_and_conn(cursor, conn)


def update_user_avatar_record(user_id, avatar_data):
    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE users SET avatar_data = %s WHERE id = %s',
            (avatar_data, user_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        close_cursor_and_conn(cursor, conn)