from datetime import datetime, timedelta

from database import get_connection
from models import Event
from repositories.base import close_cursor_and_conn


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


def subscribe_user_to_event_record(event_id, usuario_id):
    conn = get_connection()
    cursor = None
    try:
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
        close_cursor_and_conn(cursor, conn)


def confirm_subscription_payment_record(event_id, usuario_id):
    conn = get_connection()
    cursor = None
    try:
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
        close_cursor_and_conn(cursor, conn)


def list_user_subscribed_events_records(usuario_id):
    conn = get_connection()
    cursor = None
    try:
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
        close_cursor_and_conn(cursor, conn)


def unsubscribe_user_from_event_record(event_id, usuario_id):
    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM event_subscriptions WHERE evento_id = %s AND usuario_id = %s',
            (event_id, usuario_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        close_cursor_and_conn(cursor, conn)