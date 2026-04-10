from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_connection

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
        self.local_nome = data.get('local_nome')
        self.cidade = data.get('cidade')
        self.estado = data.get('estado')
        self.idade = data.get('idade')
        self.imagem_url = data.get('imagem_url')
        self.criado_em = data.get('criado_em')
        self.organizador_nome = data.get('organizador_nome')

    def to_dict(self):
        return {
            'id': self.id,
            'organizador_id': self.organizador_id,
            'organizador_nome': self.organizador_nome,
            'nome': self.nome,
            'descricao': self.descricao,
            'categoria': self.categoria,
            'data_inicio': self.data_inicio.isoformat() if hasattr(self.data_inicio, 'isoformat') else self.data_inicio,
            'hora_inicio': str(self.hora_inicio) if self.hora_inicio is not None else None,
            'hora_fim': str(self.hora_fim) if self.hora_fim is not None else None,
            'formato': self.formato,
            'local_nome': self.local_nome,
            'cidade': self.cidade,
            'estado': self.estado,
            'idade': self.idade,
            'imagem_url': self.imagem_url,
            'criado_em': self.criado_em.isoformat() if hasattr(self.criado_em, 'isoformat') else self.criado_em,
        }


def create_user(nome, email, senha, tipo, cpf=None, cnpj=None, telefone=None, cep=None, cidade=None, estado=None):
    senha_hash = generate_password_hash(senha)
    conn = get_connection()
    try:
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
        cursor.close()
        conn.close()


def find_user_by_email(email):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
        row = cursor.fetchone()
        return User(row) if row else None
    finally:
        cursor.close()
        conn.close()


def get_user_by_id(user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
        row = cursor.fetchone()
        return User(row) if row else None
    finally:
        cursor.close()
        conn.close()


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
    try:
        cursor = conn.cursor()
        cursor.execute(sql, tuple(params))
        conn.commit()
        return True
    finally:
        cursor.close()
        conn.close()


def create_event(organizador_id, nome, descricao=None, categoria=None, data_inicio=None, hora_inicio=None, hora_fim=None, formato='presencial', local_nome=None, cidade=None, estado=None, idade=None, imagem_url=None):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            INSERT INTO events (organizador_id, nome, descricao, categoria, data_inicio, hora_inicio, hora_fim, formato, local_nome, cidade, estado, idade, imagem_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            (organizador_id, nome, descricao, categoria, data_inicio, hora_inicio, hora_fim, formato, local_nome, cidade, estado, idade, imagem_url),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()


def list_events(categoria=None, cidade=None, estado=None, formato=None, organizador_id=None, search=None):
    sql = '''
        SELECT e.*, u.nome AS organizador_nome
        FROM events e
        JOIN users u ON u.id = e.organizador_id
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
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        return [Event(row) for row in rows]
    finally:
        cursor.close()
        conn.close()


def get_event(event_id):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            SELECT e.*, u.nome AS organizador_nome
            FROM events e
            JOIN users u ON u.id = e.organizador_id
            WHERE e.id = %s
            ''',
            (event_id,),
        )
        row = cursor.fetchone()
        return Event(row) if row else None
    finally:
        cursor.close()
        conn.close()
