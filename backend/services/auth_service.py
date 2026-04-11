from flask_jwt_extended import create_access_token

from repositories.user_repository import create_user_record, find_user_by_email_record
from services.errors import ServiceError


def register_user(data):
    nome = (data.get('nome') or '').strip()
    email = (data.get('email') or '').strip().lower()
    senha = data.get('senha')
    tipo = (data.get('tipo') or '').strip().lower()

    if not nome or not email or not senha or tipo not in ('pf', 'pj'):
        raise ServiceError('Campos obrigatórios ausentes ou inválidos.', status_code=400)

    if find_user_by_email_record(email) is not None:
        raise ServiceError('E-mail já cadastrado.', status_code=400)

    return create_user_record(
        nome=nome,
        email=email,
        senha=senha,
        tipo=tipo,
        cpf=data.get('cpf'),
        cnpj=data.get('cnpj'),
        telefone=data.get('telefone'),
        cep=data.get('cep'),
        cidade=data.get('cidade'),
        estado=data.get('estado'),
    )


def login_user(data):
    email = (data.get('email') or '').strip().lower()
    senha = data.get('senha')

    if not email or not senha:
        raise ServiceError('E-mail e senha são obrigatórios.', status_code=400)

    user = find_user_by_email_record(email)
    if user is None:
        raise ServiceError('Usuário não encontrado.', status_code=401)

    if not user.check_password(senha):
        raise ServiceError('E-mail ou senha incorretos.', status_code=401)

    return {
        'access_token': create_access_token(identity=str(user.id)),
        'user': user.to_public_dict(),
    }