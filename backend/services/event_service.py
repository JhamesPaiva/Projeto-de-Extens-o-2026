from datetime import date, timedelta

from repositories.event_repository import (
    create_event_record,
    delete_event_record,
    get_event_record,
    list_events_records,
    update_event_record,
)
from repositories.errors import RepositoryError
from repositories.subscription_repository import (
    confirm_subscription_payment_record,
    list_user_subscribed_events_records,
    subscribe_user_to_event_record,
    unsubscribe_user_from_event_record,
)
from repositories.user_repository import get_user_by_id_record
from services.errors import ServiceError


def _resolve_date_range(data_filter):
    hoje = date.today()
    data_inicio_de = None
    data_inicio_ate = None

    if data_filter == 'today':
        data_inicio_de = hoje
        data_inicio_ate = hoje
    elif data_filter == 'this_week':
        inicio_semana = hoje - timedelta(days=hoje.weekday())
        fim_semana = inicio_semana + timedelta(days=6)
        data_inicio_de = inicio_semana
        data_inicio_ate = fim_semana
    elif data_filter == 'this_month':
        primeiro_dia = date(hoje.year, hoje.month, 1)
        if hoje.month == 12:
            prox_mes = date(hoje.year + 1, 1, 1)
        else:
            prox_mes = date(hoje.year, hoje.month + 1, 1)
        ultimo_dia = prox_mes - timedelta(days=1)
        data_inicio_de = primeiro_dia
        data_inicio_ate = ultimo_dia
    elif data_filter == 'next_month':
        if hoje.month == 12:
            primeiro_dia = date(hoje.year + 1, 1, 1)
            prox_mes = date(hoje.year + 1, 2, 1)
        elif hoje.month == 11:
            primeiro_dia = date(hoje.year, 12, 1)
            prox_mes = date(hoje.year + 1, 1, 1)
        else:
            primeiro_dia = date(hoje.year, hoje.month + 1, 1)
            prox_mes = date(hoje.year, hoje.month + 2, 1)
        ultimo_dia = prox_mes - timedelta(days=1)
        data_inicio_de = primeiro_dia
        data_inicio_ate = ultimo_dia

    return data_inicio_de, data_inicio_ate


def _normalize_formato(formato_raw):
    formato_map = {
        'presencial': 'presencial',
        'online': 'online',
        'hibrido': 'híbrido',
        'híbrido': 'híbrido',
    }
    return formato_map.get((formato_raw or '').strip().lower())


def _normalize_entrada(entrada_raw):
    entrada = str(entrada_raw or '').strip().lower()
    return entrada if entrada in {'gratuito', 'pago'} else None


def _normalize_image_value(image_value):
    if isinstance(image_value, str):
        image_value = image_value.strip()
        if not image_value:
            return None
        if image_value.startswith('data:image/'):
            if len(image_value) > 2_500_000:
                raise ServiceError('Imagem muito grande. Tente uma imagem menor.', status_code=400)
            return image_value
        if len(image_value) > 2048:
            raise ServiceError('URL da imagem muito longa. Use um link público de imagem menor.', status_code=400)
        return image_value
    if image_value is not None:
        raise ServiceError('Formato de imagem inválido.', status_code=400)
    return image_value


def list_events_data(query_args):
    data_inicio_de, data_inicio_ate = _resolve_date_range(query_args.get('data'))
    filtros = {
        'categoria': query_args.get('categoria'),
        'cidade': query_args.get('cidade'),
        'estado': query_args.get('estado'),
        'formato': query_args.get('formato'),
        'entrada': query_args.get('entrada'),
        'organizador_id': query_args.get('organizador_id'),
        'search': query_args.get('search'),
        'idade': query_args.get('idade'),
        'data_inicio_de': data_inicio_de,
        'data_inicio_ate': data_inicio_ate,
    }
    eventos = list_events_records(**{key: value for key, value in filtros.items() if value})
    return [event.to_dict() for event in eventos]


def get_event_detail(event_id):
    event = get_event_record(event_id)
    if event is None:
        raise ServiceError('Evento não encontrado.', status_code=404)
    return event.to_dict()


def create_event_for_user(user_id, data):
    nome = (data.get('nome') or '').strip()
    data_inicio = data.get('data_inicio')
    formato = _normalize_formato(data.get('formato') or 'presencial')
    imagem_url = _normalize_image_value(data.get('imagem_url'))

    if not nome or not data_inicio:
        raise ServiceError('Nome do evento e data de início são obrigatórios.', status_code=400)

    if formato is None:
        raise ServiceError('Formato do evento inválido.', status_code=400)

    try:
        event_id = create_event_record(
            organizador_id=user_id,
            nome=nome,
            descricao=data.get('descricao'),
            categoria=data.get('categoria'),
            data_inicio=data_inicio,
            hora_inicio=data.get('hora_inicio'),
            hora_fim=data.get('hora_fim'),
            formato=formato,
            entrada=_normalize_entrada(data.get('entrada')),
            local_nome=data.get('local_nome'),
            cidade=data.get('cidade'),
            estado=data.get('estado'),
            idade=data.get('idade'),
            imagem_url=imagem_url,
        )
    except RepositoryError:
        raise ServiceError('Não foi possível salvar o evento com os dados informados.', status_code=400)

    return {'message': 'Evento criado com sucesso.', 'event_id': event_id}


def update_event_for_user(user_id, event_id, data):
    payload = {
        'nome': (data.get('nome') or '').strip() if 'nome' in data else None,
        'descricao': data.get('descricao') if 'descricao' in data else None,
        'categoria': data.get('categoria') if 'categoria' in data else None,
        'data_inicio': data.get('data_inicio') if 'data_inicio' in data else None,
        'hora_inicio': data.get('hora_inicio') if 'hora_inicio' in data else None,
        'hora_fim': data.get('hora_fim') if 'hora_fim' in data else None,
        'formato': _normalize_formato(data.get('formato')) if 'formato' in data else None,
        'entrada': _normalize_entrada(data.get('entrada')) if 'entrada' in data else None,
        'local_nome': data.get('local_nome') if 'local_nome' in data else None,
        'cidade': data.get('cidade') if 'cidade' in data else None,
        'estado': data.get('estado') if 'estado' in data else None,
        'idade': data.get('idade') if 'idade' in data else None,
        'imagem_url': data.get('imagem_url') if 'imagem_url' in data else None,
    }

    if 'formato' in data and payload['formato'] is None:
        raise ServiceError('Formato do evento inválido.', status_code=400)

    if 'nome' in data and not (data.get('nome') or '').strip():
        raise ServiceError('Nome do evento não pode ficar vazio.', status_code=400)

    if 'imagem_url' in data:
        payload['imagem_url'] = _normalize_image_value(payload['imagem_url'])

    filtered_payload = {key: value for key, value in payload.items() if key in data}
    if not filtered_payload:
        raise ServiceError('Nenhum campo válido para atualização.', status_code=400)

    updated = update_event_record(event_id=event_id, organizador_id=user_id, **filtered_payload)
    if not updated:
        raise ServiceError('Evento não encontrado ou sem permissão.', status_code=404)

    event = get_event_record(event_id)
    return {
        'message': 'Evento atualizado com sucesso.',
        'event': event.to_dict() if event else None,
    }


def delete_event_for_user(user_id, event_id):
    deleted = delete_event_record(event_id=event_id, organizador_id=user_id)
    if not deleted:
        raise ServiceError('Evento não encontrado ou sem permissão.', status_code=404)
    return {'message': 'Evento excluído com sucesso.'}


def _get_pf_user(user_id, missing_message, invalid_type_message):
    user = get_user_by_id_record(user_id)
    if user is None:
        raise ServiceError(missing_message, status_code=404)
    if str(user.tipo).lower() != 'pf':
        raise ServiceError(invalid_type_message, status_code=403)
    return user


def subscribe_user(user_id, event_id):
    _get_pf_user(
        user_id,
        missing_message='Usuário não encontrado.',
        invalid_type_message='Apenas usuários PF podem se inscrever em eventos.',
    )

    subscribed = subscribe_user_to_event_record(event_id=event_id, usuario_id=user_id)
    result = (subscribed or {}).get('result')

    if result == 'event_not_found':
        raise ServiceError('Evento não encontrado.', status_code=404)
    if result == 'already_subscribed':
        subscription_status = subscribed.get('status')
        if subscription_status == 'pendente_pagamento':
            raise ServiceError(
                'Você já possui uma inscrição pendente de pagamento para este evento.',
                status_code=409,
                extra_payload={'status': 'pendente_pagamento'},
            )
        raise ServiceError(
            'Você já está inscrito neste evento.',
            status_code=409,
            extra_payload={'status': 'confirmado'},
        )

    if result == 'pending_payment':
        return ({
            'message': 'Inscrição criada! Conclua o pagamento para confirmar sua vaga.',
            'status': 'pendente_pagamento',
            'payment_reference': subscribed.get('payment_reference'),
            'expires_em': subscribed.get('expires_em'),
            'checkout_url': f'/checkout/simulado?evento_id={event_id}',
        }, 202)

    if result != 'confirmed':
        raise ServiceError('Não foi possível iniciar sua inscrição agora.', status_code=400)

    event = get_event_record(event_id)
    inscritos_count = event.to_dict().get('inscritos_count', 0) if event else 0
    return ({
        'message': 'Inscrição realizada com sucesso!',
        'status': 'confirmado',
        'inscritos_count': inscritos_count,
    }, 201)


def confirm_subscription_for_user(user_id, event_id):
    _get_pf_user(
        user_id,
        missing_message='Usuário não encontrado.',
        invalid_type_message='Apenas usuários PF podem confirmar pagamento de inscrição.',
    )

    confirmation = confirm_subscription_payment_record(event_id=event_id, usuario_id=user_id)
    result = (confirmation or {}).get('result')

    if result == 'not_found':
        raise ServiceError('Inscrição pendente não encontrada para este evento.', status_code=404)
    if result == 'already_confirmed':
        return ({'message': 'Pagamento já confirmado para este evento.', 'status': 'confirmado'}, 200)
    if result == 'expired':
        raise ServiceError(
            'Sua pendência de pagamento expirou. Gere uma nova inscrição para continuar.',
            status_code=409,
            extra_payload={'status': 'expirado'},
        )
    if result == 'invalid_status':
        raise ServiceError('Esta inscrição não está pendente de pagamento.', status_code=409)
    if result != 'confirmed':
        raise ServiceError('Não foi possível confirmar o pagamento.', status_code=400)

    event = get_event_record(event_id)
    inscritos_count = event.to_dict().get('inscritos_count', 0) if event else 0
    return ({
        'message': 'Pagamento confirmado! Inscrição efetivada.',
        'status': 'confirmado',
        'inscritos_count': inscritos_count,
    }, 200)


def list_user_subscriptions_data(user_id):
    _get_pf_user(
        user_id,
        missing_message='Usuário não encontrado.',
        invalid_type_message='Apenas usuários PF possuem inscrições em eventos.',
    )
    events = list_user_subscribed_events_records(user_id)
    return [event.to_dict() for event in events]


def unsubscribe_user(user_id, event_id):
    _get_pf_user(
        user_id,
        missing_message='Usuário não encontrado.',
        invalid_type_message='Apenas usuários PF podem cancelar inscrição.',
    )

    removed = unsubscribe_user_from_event_record(event_id=event_id, usuario_id=user_id)
    if not removed:
        raise ServiceError('Inscrição não encontrada para este evento.', status_code=404)

    return {'message': 'Inscrição cancelada com sucesso.'}