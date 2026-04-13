from datetime import datetime
from werkzeug.security import check_password_hash

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
