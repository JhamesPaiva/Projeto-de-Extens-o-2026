from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_connection


def _close_cursor_and_conn(cursor, conn):
    if cursor is not None:
        try:
            cursor.close()
        except Exception:
            pass
    if conn is not None:
        try:
            conn.close()
        except Exception:
            pass

class User:
    def __init__(self, data):
        self.id = data['id']
        self.nome = data['nome']
        self.email = data['email']
        self.tipo = data['tipo']
        self.cpf = data.get('cpf')
        self.cnpj = data.get('cnpj')
        self.telefone = data.get('telefone')
        self.cep = data.get('cep')
        self.cidade = data.get('cidade')
        self.estado = data.get('estado')
        self.avatar_data = data.get('avatar_data')
        self.criado_em = data.get('criado_em')
        self.senha_hash = data.get('senha_hash')

    def check_password(self, senha):
        return check_password_hash(self.senha_hash, senha)

    def to_public_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'tipo': self.tipo,
            'cpf': self.cpf,
            'cnpj': self.cnpj,
            'telefone': self.telefone,
            'cep': self.cep,
            'cidade': self.cidade,
            'estado': self.estado,
            'avatar_data': self.avatar_data,
            'criado_em': self.criado_em.isoformat() if isinstance(self.criado_em, datetime) else self.criado_em,
        }

class Event:
    def __init__(self, data):
        self.id = data['id']
        self.organizador_id = data['organizador_id']
        self.nome = data['nome']
        self.descricao = data.get('descricao')
        self.categoria = data.get('categoria')
        self.data_inicio = data.get('data_inicio')
        self.hora_inicio = data.get('hora_inicio')
        self.hora_fim = data.get('hora_fim')
        self.formato = data.get('formato')
        self.entrada = data.get('entrada')
        self.local_nome = data.get('local_nome')
        self.cidade = data.get('cidade')
        self.estado = data.get('estado')
        self.idade = data.get('idade')
        self.imagem_url = data.get('imagem_url')
        self.criado_em = data.get('criado_em')
        self.organizador_nome = data.get('organizador_nome')
        self.organizador_avatar_data = data.get('organizador_avatar_data')
        self.inscritos_count = data.get('inscritos_count')
        self.subscription_status = data.get('subscription_status')

    def to_dict(self):
        return {
            'id': self.id,
            'organizador_id': self.organizador_id,
            'organizador_nome': self.organizador_nome,
            'organizador_avatar_data': self.organizador_avatar_data,
            'subscription_status': self.subscription_status,
            'nome': self.nome,
            'descricao': self.descricao,
            'categoria': self.categoria,
            'data_inicio': self.data_inicio.isoformat() if hasattr(self.data_inicio, 'isoformat') else self.data_inicio,
            'hora_inicio': str(self.hora_inicio) if self.hora_inicio is not None else None,
            'hora_fim': str(self.hora_fim) if self.hora_fim is not None else None,
            'formato': self.formato,
            'entrada': self.entrada,
            'local_nome': self.local_nome,
            'cidade': self.cidade,
            'estado': self.estado,
            'idade': self.idade,
            'imagem_url': self.imagem_url,
            'inscritos_count': int(self.inscritos_count or 0),
            'criado_em': self.criado_em.isoformat() if hasattr(self.criado_em, 'isoformat') else self.criado_em,
        }


def ensure_event_subscriptions_table(conn):
    cursor = conn.cursor()
    try:
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS event_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                evento_id INT NOT NULL,
                usuario_id INT NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'confirmado',
                payment_reference VARCHAR(120) NULL,
                expires_em DATETIME NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_evento_usuario (evento_id, usuario_id),
                CONSTRAINT fk_sub_evento FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE CASCADE,
                CONSTRAINT fk_sub_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            '''
        )
        conn.commit()
    finally:
        cursor.close()

    mig_cursor = conn.cursor(dictionary=True)
    try:
        mig_cursor.execute(
            '''
            SELECT column_name AS col
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'event_subscriptions'
              AND column_name IN ('status', 'payment_reference', 'expires_em')
            '''
        )
        existing_cols = {row['col'] for row in mig_cursor.fetchall()}
    finally:
        mig_cursor.close()

    alter_cursor = conn.cursor()
    try:
        if 'status' not in existing_cols:
            alter_cursor.execute("ALTER TABLE event_subscriptions ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'confirmado' AFTER usuario_id")
        if 'payment_reference' not in existing_cols:
            alter_cursor.execute("ALTER TABLE event_subscriptions ADD COLUMN payment_reference VARCHAR(120) NULL AFTER status")
        if 'expires_em' not in existing_cols:
            alter_cursor.execute("ALTER TABLE event_subscriptions ADD COLUMN expires_em DATETIME NULL AFTER payment_reference")
        conn.commit()
    finally:
        alter_cursor.close()


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


def expire_pending_subscriptions(conn, event_id=None, usuario_id=None):
    cursor = conn.cursor()
    try:
        sql = """
            UPDATE event_subscriptions
            SET status = 'expirado'
            WHERE status = 'pendente_pagamento'
              AND expires_em IS NOT NULL
              AND expires_em < UTC_TIMESTAMP()
        """
        params = []
        if event_id is not None:
            sql += ' AND evento_id = %s'
            params.append(event_id)
        if usuario_id is not None:
            sql += ' AND usuario_id = %s'
            params.append(usuario_id)

        cursor.execute(sql, tuple(params))
        conn.commit()
        return cursor.rowcount
    finally:
        cursor.close()


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


def create_user(nome, email, senha, tipo, cpf=None, cnpj=None, telefone=None, cep=None, cidade=None, estado=None):
    senha_hash = generate_password_hash(senha)
    conn = get_connection()
    cursor = None
    try:
        ensure_users_avatar_column(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            INSERT INTO users (nome, email, senha_hash, tipo, cpf, cnpj, telefone, cep, cidade, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            (nome, email, senha_hash, tipo, cpf, cnpj, telefone, cep, cidade, estado),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        _close_cursor_and_conn(cursor, conn)


def find_user_by_email(email):
    conn = get_connection()
    cursor = None
    try:
        ensure_users_avatar_column(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
        row = cursor.fetchone()
        return User(row) if row else None
    finally:
        _close_cursor_and_conn(cursor, conn)


def get_user_by_id(user_id):
    conn = get_connection()
    cursor = None
    try:
        ensure_users_avatar_column(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
        row = cursor.fetchone()
        return User(row) if row else None
    finally:
        _close_cursor_and_conn(cursor, conn)


def update_user_profile(user_id, nome=None, telefone=None, cep=None, cidade=None, estado=None, cpf=None, cnpj=None):
    fields = []
    params = []
    if nome is not None:
        fields.append('nome = %s')
        params.append(nome)
    if telefone is not None:
        fields.append('telefone = %s')
        params.append(telefone)
    if cep is not None:
        fields.append('cep = %s')
        params.append(cep)
    if cidade is not None:
        fields.append('cidade = %s')
        params.append(cidade)
    if estado is not None:
        fields.append('estado = %s')
        params.append(estado)
    if cpf is not None:
        fields.append('cpf = %s')
        params.append(cpf)
    if cnpj is not None:
        fields.append('cnpj = %s')
        params.append(cnpj)

    if not fields:
        return False

    params.append(user_id)
    sql = f"UPDATE users SET {', '.join(fields)} WHERE id = %s"
    conn = get_connection()
    cursor = None
    try:
        ensure_users_avatar_column(conn)
        cursor = conn.cursor()
        cursor.execute(sql, tuple(params))
        conn.commit()
        return True
    finally:
        _close_cursor_and_conn(cursor, conn)


def update_user_avatar(user_id, avatar_data):
    conn = get_connection()
    cursor = None
    try:
        ensure_users_avatar_column(conn)
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE users SET avatar_data = %s WHERE id = %s',
            (avatar_data, user_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        _close_cursor_and_conn(cursor, conn)


def create_event(organizador_id, nome, descricao=None, categoria=None, data_inicio=None, hora_inicio=None, hora_fim=None, formato='presencial', entrada=None, local_nome=None, cidade=None, estado=None, idade=None, imagem_url=None):
    conn = get_connection()
    cursor = None
    try:
        ensure_events_entrada_column(conn)
        ensure_events_imagem_column_type(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            INSERT INTO events (organizador_id, nome, descricao, categoria, data_inicio, hora_inicio, hora_fim, formato, entrada, local_nome, cidade, estado, idade, imagem_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            (organizador_id, nome, descricao, categoria, data_inicio, hora_inicio, hora_fim, formato, entrada, local_nome, cidade, estado, idade, imagem_url),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        _close_cursor_and_conn(cursor, conn)


def list_events(categoria=None, cidade=None, estado=None, formato=None, entrada=None, organizador_id=None, search=None, idade=None, data_inicio_de=None, data_inicio_ate=None):
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
    if categoria:
        conditions.append('e.categoria = %s')
        params.append(categoria)
    if cidade:
        conditions.append('e.cidade = %s')
        params.append(cidade)
    if estado:
        conditions.append('e.estado = %s')
        params.append(estado)
    if formato:
        conditions.append('e.formato = %s')
        params.append(formato)
    if entrada:
        conditions.append('e.entrada = %s')
        params.append(entrada)
    if idade:
        conditions.append('e.idade = %s')
        params.append(idade)
    if data_inicio_de:
        conditions.append('e.data_inicio >= %s')
        params.append(data_inicio_de)
    if data_inicio_ate:
        conditions.append('e.data_inicio <= %s')
        params.append(data_inicio_ate)
    if organizador_id:
        conditions.append('e.organizador_id = %s')
        params.append(organizador_id)
    if search:
        conditions.append('(e.nome LIKE %s OR e.descricao LIKE %s OR e.categoria LIKE %s)')
        q = f'%{search}%'
        params.extend([q, q, q])

    if conditions:
        sql += ' WHERE ' + ' AND '.join(conditions)
    sql += ' ORDER BY e.data_inicio ASC, e.nome ASC'

    conn = get_connection()
    cursor = None
    try:
        ensure_event_subscriptions_table(conn)
        ensure_events_entrada_column(conn)
        ensure_events_imagem_column_type(conn)
        expire_pending_subscriptions(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        return [Event(row) for row in rows]
    finally:
        _close_cursor_and_conn(cursor, conn)


def get_event(event_id):
    conn = get_connection()
    cursor = None
    try:
        ensure_event_subscriptions_table(conn)
        ensure_events_entrada_column(conn)
        ensure_events_imagem_column_type(conn)
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
        _close_cursor_and_conn(cursor, conn)


def update_event(event_id, organizador_id, **fields):
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
    for key, value in fields.items():
        if key in allowed_fields:
            updates.append(f'{key} = %s')
            params.append(value)

    if not updates:
        return False

    params.extend([event_id, organizador_id])

    conn = get_connection()
    cursor = None
    try:
        ensure_events_imagem_column_type(conn)
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
        _close_cursor_and_conn(cursor, conn)


def delete_event(event_id, organizador_id):
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
        _close_cursor_and_conn(cursor, conn)


def subscribe_user_to_event(event_id, usuario_id):
    conn = get_connection()
    cursor = None
    try:
        ensure_event_subscriptions_table(conn)
        expire_pending_subscriptions(conn, event_id=event_id, usuario_id=usuario_id)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            'SELECT id, entrada FROM events WHERE id = %s',
            (event_id,),
        )
        event_row = cursor.fetchone()
        if not event_row:
            return {'result': 'event_not_found'}

        entrada = str(event_row.get('entrada') or 'gratuito').strip().lower()
        if entrada not in {'gratuito', 'pago'}:
            entrada = 'gratuito'

        cursor.execute(
            'SELECT id, status, expires_em FROM event_subscriptions WHERE evento_id = %s AND usuario_id = %s',
            (event_id, usuario_id),
        )
        existing = cursor.fetchone()

        if entrada == 'pago':
            expires_em = datetime.utcnow() + timedelta(minutes=15)
            payment_reference = f'PAY-{event_id}-{usuario_id}-{int(datetime.utcnow().timestamp())}'

            if existing:
                current_status = str(existing.get('status') or 'confirmado').lower()
                if current_status == 'pendente_pagamento':
                    expires_em_existing = existing.get('expires_em')
                    if expires_em_existing and expires_em_existing <= datetime.utcnow():
                        cursor.execute(
                            "UPDATE event_subscriptions SET status = 'expirado' WHERE id = %s",
                            (existing['id'],),
                        )
                        conn.commit()
                        current_status = 'expirado'

                if current_status in {'confirmado', 'pendente_pagamento'}:
                    return {
                        'result': 'already_subscribed',
                        'status': current_status,
                    }

                cursor.execute(
                    '''
                    UPDATE event_subscriptions
                    SET status = 'pendente_pagamento', payment_reference = %s, expires_em = %s
                    WHERE id = %s
                    ''',
                    (payment_reference, expires_em, existing['id']),
                )
            else:
                cursor.execute(
                    '''
                    INSERT INTO event_subscriptions (evento_id, usuario_id, status, payment_reference, expires_em)
                    VALUES (%s, %s, 'pendente_pagamento', %s, %s)
                    ''',
                    (event_id, usuario_id, payment_reference, expires_em),
                )

            conn.commit()
            return {
                'result': 'pending_payment',
                'status': 'pendente_pagamento',
                'payment_reference': payment_reference,
                'expires_em': expires_em.isoformat(),
            }

        if existing:
            current_status = str(existing.get('status') or 'confirmado').lower()
            if current_status == 'confirmado':
                return {'result': 'already_subscribed', 'status': 'confirmado'}
            cursor.execute(
                "UPDATE event_subscriptions SET status = 'confirmado', payment_reference = NULL, expires_em = NULL WHERE id = %s",
                (existing['id'],),
            )
        else:
            cursor.execute(
                "INSERT INTO event_subscriptions (evento_id, usuario_id, status) VALUES (%s, %s, 'confirmado')",
                (event_id, usuario_id),
            )

        conn.commit()
        return {'result': 'confirmed', 'status': 'confirmado'}
    finally:
        _close_cursor_and_conn(cursor, conn)


def confirm_subscription_payment(event_id, usuario_id):
    conn = get_connection()
    cursor = None
    try:
        ensure_event_subscriptions_table(conn)
        expire_pending_subscriptions(conn, event_id=event_id, usuario_id=usuario_id)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            SELECT id, status, expires_em
            FROM event_subscriptions
            WHERE evento_id = %s AND usuario_id = %s
            ''',
            (event_id, usuario_id),
        )
        row = cursor.fetchone()
        if not row:
            return {'result': 'not_found'}

        status = str(row.get('status') or 'confirmado').lower()
        if status == 'confirmado':
            return {'result': 'already_confirmed'}
        if status == 'expirado':
            return {'result': 'expired'}
        if status != 'pendente_pagamento':
            return {'result': 'invalid_status', 'status': status}

        expires_em = row.get('expires_em')
        if expires_em and expires_em <= datetime.utcnow():
            cursor.execute(
                "UPDATE event_subscriptions SET status = 'expirado' WHERE id = %s",
                (row['id'],),
            )
            conn.commit()
            return {'result': 'expired'}

        cursor.execute(
            "UPDATE event_subscriptions SET status = 'confirmado', expires_em = NULL WHERE id = %s",
            (row['id'],),
        )
        conn.commit()
        return {'result': 'confirmed'}
    finally:
        _close_cursor_and_conn(cursor, conn)


def list_user_subscribed_events(usuario_id):
    conn = get_connection()
    cursor = None
    try:
        ensure_event_subscriptions_table(conn)
        ensure_events_entrada_column(conn)
        ensure_events_imagem_column_type(conn)
        expire_pending_subscriptions(conn, usuario_id=usuario_id)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            SELECT e.*, u.nome AS organizador_nome, u.avatar_data AS organizador_avatar_data, s.status AS subscription_status, COALESCE(es.inscritos_count, 0) AS inscritos_count
            FROM event_subscriptions s
            JOIN events e ON e.id = s.evento_id
            JOIN users u ON u.id = e.organizador_id
            LEFT JOIN (
                SELECT evento_id, COUNT(*) AS inscritos_count
                FROM event_subscriptions
                WHERE status = 'confirmado' OR status IS NULL
                GROUP BY evento_id
            ) es ON es.evento_id = e.id
            WHERE s.usuario_id = %s
            ORDER BY e.data_inicio ASC, e.nome ASC
            ''',
            (usuario_id,),
        )
        rows = cursor.fetchall()
        return [Event(row) for row in rows]
    finally:
        _close_cursor_and_conn(cursor, conn)


def unsubscribe_user_from_event(event_id, usuario_id):
    conn = get_connection()
    cursor = None
    try:
        ensure_event_subscriptions_table(conn)
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM event_subscriptions WHERE evento_id = %s AND usuario_id = %s',
            (event_id, usuario_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        _close_cursor_and_conn(cursor, conn)
