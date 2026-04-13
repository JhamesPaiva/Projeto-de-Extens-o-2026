from database import get_connection
from models import Event
from repositories.base import close_cursor_and_conn
from repositories.errors import RepositoryError
from repositories.subscription_repository import expire_pending_subscriptions


def ensure_events_entrada_column(conn):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            '''
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'events'
              AND column_name = 'entrada'
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
        alter_cursor.execute("ALTER TABLE events ADD COLUMN entrada VARCHAR(20) NULL AFTER formato")
        conn.commit()
    finally:
        alter_cursor.close()


def ensure_events_imagem_column_type(conn):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            '''
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'events'
              AND column_name = 'imagem_url'
            LIMIT 1
            '''
        )
        row = cursor.fetchone()
    finally:
        cursor.close()

    if not row:
        return

    data_type = str(row.get('data_type') or '').lower()
    if data_type in {'text', 'mediumtext', 'longtext'}:
        return

    alter_cursor = conn.cursor()
    try:
        alter_cursor.execute('ALTER TABLE events MODIFY COLUMN imagem_url MEDIUMTEXT NULL')
        conn.commit()
    finally:
        alter_cursor.close()


def create_event_record(**payload):
    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            INSERT INTO events (organizador_id, nome, descricao, categoria, data_inicio, hora_inicio, hora_fim, formato, entrada, local_nome, cidade, estado, idade, imagem_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            (
                payload['organizador_id'],
                payload['nome'],
                payload.get('descricao'),
                payload.get('categoria'),
                payload.get('data_inicio'),
                payload.get('hora_inicio'),
                payload.get('hora_fim'),
                payload.get('formato', 'presencial'),
                payload.get('entrada'),
                payload.get('local_nome'),
                payload.get('cidade'),
                payload.get('estado'),
                payload.get('idade'),
                payload.get('imagem_url'),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as error:
        raise RepositoryError('Falha ao salvar evento.') from error
    finally:
        close_cursor_and_conn(cursor, conn)


def list_events_records(**filters):
    sql = '''
        SELECT e.*, u.nome AS organizador_nome, u.avatar_data AS organizador_avatar_data, COALESCE(es.inscritos_count, 0) AS inscritos_count
        FROM events e
        JOIN users u ON u.id = e.organizador_id
        LEFT JOIN (
            SELECT evento_id, COUNT(*) AS inscritos_count
            FROM event_subscriptions
            WHERE status = 'confirmado' OR status IS NULL
            GROUP BY evento_id
        ) es ON es.evento_id = e.id
    '''
    conditions = []
    params = []
    if filters.get('categoria'):
        conditions.append('e.categoria = %s')
        params.append(filters.get('categoria'))
    if filters.get('cidade'):
        conditions.append('e.cidade = %s')
        params.append(filters.get('cidade'))
    if filters.get('estado'):
        conditions.append('e.estado = %s')
        params.append(filters.get('estado'))
    if filters.get('formato'):
        conditions.append('e.formato = %s')
        params.append(filters.get('formato'))
    if filters.get('entrada'):
        conditions.append('e.entrada = %s')
        params.append(filters.get('entrada'))
    if filters.get('idade'):
        conditions.append('e.idade = %s')
        params.append(filters.get('idade'))
    if filters.get('data_inicio_de'):
        conditions.append('e.data_inicio >= %s')
        params.append(filters.get('data_inicio_de'))
    if filters.get('data_inicio_ate'):
        conditions.append('e.data_inicio <= %s')
        params.append(filters.get('data_inicio_ate'))
    if filters.get('organizador_id'):
        conditions.append('e.organizador_id = %s')
        params.append(filters.get('organizador_id'))
    if filters.get('search'):
        conditions.append('(e.nome LIKE %s OR e.descricao LIKE %s OR e.categoria LIKE %s)')
        query = f"%{filters.get('search')}%"
        params.extend([query, query, query])

    if conditions:
        sql += ' WHERE ' + ' AND '.join(conditions)
    sql += ' ORDER BY e.data_inicio ASC, e.nome ASC'

    conn = get_connection()
    cursor = None
    try:
        expire_pending_subscriptions(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        return [Event(row) for row in rows]
    finally:
        close_cursor_and_conn(cursor, conn)


def get_event_record(event_id):
    conn = get_connection()
    cursor = None
    try:
        expire_pending_subscriptions(conn, event_id=event_id)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            SELECT e.*, u.nome AS organizador_nome, u.avatar_data AS organizador_avatar_data, COALESCE(es.inscritos_count, 0) AS inscritos_count
            FROM events e
            JOIN users u ON u.id = e.organizador_id
            LEFT JOIN (
                SELECT evento_id, COUNT(*) AS inscritos_count
                FROM event_subscriptions
                WHERE status = 'confirmado' OR status IS NULL
                GROUP BY evento_id
            ) es ON es.evento_id = e.id
            WHERE e.id = %s
            ''',
            (event_id,),
        )
        row = cursor.fetchone()
        return Event(row) if row else None
    finally:
        close_cursor_and_conn(cursor, conn)


def update_event_record(event_id, organizador_id, **payload):
    allowed_fields = {
        'nome',
        'descricao',
        'categoria',
        'data_inicio',
        'hora_inicio',
        'hora_fim',
        'formato',
        'entrada',
        'local_nome',
        'cidade',
        'estado',
        'idade',
        'imagem_url',
    }

    updates = []
    params = []
    for key, value in payload.items():
        if key in allowed_fields:
            updates.append(f'{key} = %s')
            params.append(value)

    if not updates:
        return False

    params.extend([event_id, organizador_id])

    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""
            UPDATE events
            SET {', '.join(updates)}
            WHERE id = %s AND organizador_id = %s
            """,
            tuple(params),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        close_cursor_and_conn(cursor, conn)


def delete_event_record(event_id, organizador_id):
    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM events WHERE id = %s AND organizador_id = %s',
            (event_id, organizador_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        close_cursor_and_conn(cursor, conn)