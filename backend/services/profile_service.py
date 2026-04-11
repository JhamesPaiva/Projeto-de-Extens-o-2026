from repositories.user_repository import (
    get_user_by_id_record,
    update_user_avatar_record,
    update_user_profile_record,
)
from services.errors import ServiceError


def get_profile_data(user_id):
    user = get_user_by_id_record(user_id)
    if user is None:
        raise ServiceError('Usuário não encontrado.', status_code=404)
    return user.to_public_dict()


def update_profile_data(user_id, data):
    user = get_user_by_id_record(user_id)
    if user is None:
        raise ServiceError('Usuário não encontrado.', status_code=404)

    update_user_profile_record(
        user_id,
        nome=data.get('nome'),
        telefone=data.get('telefone'),
        cep=data.get('cep'),
        cidade=data.get('cidade'),
        estado=data.get('estado'),
        cpf=data.get('cpf'),
        cnpj=data.get('cnpj'),
    )

    updated_user = get_user_by_id_record(user_id)
    return updated_user.to_public_dict() if updated_user else {}


def update_avatar_data(user_id, data):
    avatar_data = data.get('avatar_data')

    if avatar_data is not None:
        if not isinstance(avatar_data, str):
            raise ServiceError('Formato de avatar inválido.', status_code=400)
        avatar_data = avatar_data.strip()
        if avatar_data and not avatar_data.startswith('data:image/'):
            raise ServiceError('A imagem deve estar em formato data URL.', status_code=400)
        if len(avatar_data) > 2_500_000:
            raise ServiceError('Imagem muito grande. Tente uma imagem menor.', status_code=400)

    updated = update_user_avatar_record(user_id=user_id, avatar_data=avatar_data)
    if not updated:
        raise ServiceError('Usuário não encontrado.', status_code=404)

    user = get_user_by_id_record(user_id)
    return {
        'message': 'Avatar atualizado com sucesso.',
        'user': user.to_public_dict() if user else None,
    }