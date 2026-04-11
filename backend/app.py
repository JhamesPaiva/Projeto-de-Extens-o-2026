from flask import Flask, request, jsonify
import mysql.connector
from datetime import date, timedelta
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

from config import Config
from models import (
    create_user,
    find_user_by_email,
    get_user_by_id,
    update_user_profile,
    create_event,
    list_events,
    get_event,
    update_event,
    delete_event,
    subscribe_user_to_event,
    confirm_subscription_payment,
    list_user_subscribed_events,
    unsubscribe_user_from_event,
    update_user_avatar,
)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)


def get_current_user_id():
    identity = get_jwt_identity()
    try:
        return int(identity)
    except (TypeError, ValueError):
        return None

@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok', 'message': 'Backend Python rodando'}), 200

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    nome = (data.get('nome') or '').strip()
    email = (data.get('email') or '').strip().lower()
    senha = data.get('senha')
    tipo = (data.get('tipo') or '').strip().lower()

    if not nome or not email or not senha or tipo not in ('pf', 'pj'):
        return jsonify({'message': 'Campos obrigatórios ausentes ou inválidos.'}), 400

    if find_user_by_email(email) is not None:
        return jsonify({'message': 'E-mail já cadastrado.'}), 400

    user_id = create_user(
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

    return jsonify({'message': 'Registro concluído.', 'user_id': user_id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'message': 'E-mail e senha são obrigatórios.'}), 400

    user = find_user_by_email(email)
    if user is None:
        return jsonify({'message': 'Usuário não encontrado.'}), 401

    if not user.check_password(senha):
        return jsonify({'message': 'E-mail ou senha incorretos.'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'access_token': access_token,
        'user': user.to_public_dict(),
    }), 200

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401
    user = get_user_by_id(user_id)
    if user is None:
        return jsonify({'message': 'Usuário não encontrado.'}), 404
    return jsonify(user.to_public_dict()), 200

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def profile_update():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401
    data = request.json or {}
    user = get_user_by_id(user_id)
    if user is None:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    update_user_profile(
        user_id=user_id,
        nome=data.get('nome'),
        telefone=data.get('telefone'),
        cep=data.get('cep'),
        cidade=data.get('cidade'),
        estado=data.get('estado'),
        cpf=data.get('cpf'),
        cnpj=data.get('cnpj'),
    )
    updated_user = get_user_by_id(user_id)
    return jsonify(updated_user.to_public_dict()), 200


@app.route('/api/profile/avatar', methods=['PUT'])
@jwt_required()
def profile_avatar_update():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401

    data = request.json or {}
    avatar_data = data.get('avatar_data')

    if avatar_data is not None:
        if not isinstance(avatar_data, str):
            return jsonify({'message': 'Formato de avatar inválido.'}), 400
        avatar_data = avatar_data.strip()
        if avatar_data and not avatar_data.startswith('data:image/'):
            return jsonify({'message': 'A imagem deve estar em formato data URL.'}), 400
        if len(avatar_data) > 2_500_000:
            return jsonify({'message': 'Imagem muito grande. Tente uma imagem menor.'}), 400

    updated = update_user_avatar(user_id=user_id, avatar_data=avatar_data)
    if not updated:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    user = get_user_by_id(user_id)
    return jsonify({'message': 'Avatar atualizado com sucesso.', 'user': user.to_public_dict() if user else None}), 200

@app.route('/api/events', methods=['GET'])
def events_list():
    data_filter = request.args.get('data')
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

    filtros = {
        'categoria': request.args.get('categoria'),
        'cidade': request.args.get('cidade'),
        'estado': request.args.get('estado'),
        'formato': request.args.get('formato'),
        'entrada': request.args.get('entrada'),
        'organizador_id': request.args.get('organizador_id'),
        'search': request.args.get('search'),
        'idade': request.args.get('idade'),
        'data_inicio_de': data_inicio_de,
        'data_inicio_ate': data_inicio_ate,
    }
    eventos = list_events(**{k: v for k, v in filtros.items() if v})
    return jsonify({'events': [event.to_dict() for event in eventos]}), 200

@app.route('/api/events/<int:event_id>', methods=['GET'])
def event_detail(event_id):
    event = get_event(event_id)
    if event is None:
        return jsonify({'message': 'Evento não encontrado.'}), 404
    return jsonify(event.to_dict()), 200

@app.route('/api/events', methods=['POST'])
@jwt_required()
def create_event_route():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401
    data = request.json or {}

    nome = (data.get('nome') or '').strip()
    descricao = data.get('descricao')
    categoria = data.get('categoria')
    data_inicio = data.get('data_inicio')
    hora_inicio = data.get('hora_inicio')
    hora_fim = data.get('hora_fim')
    formato_raw = (data.get('formato') or 'presencial').strip().lower()
    formato_map = {
        'presencial': 'presencial',
        'online': 'online',
        'hibrido': 'híbrido',
        'híbrido': 'híbrido',
    }
    formato = formato_map.get(formato_raw)
    entrada_raw = (data.get('entrada') or '').strip().lower()
    entrada = entrada_raw if entrada_raw in {'gratuito', 'pago'} else None
    local_nome = data.get('local_nome')
    cidade = data.get('cidade')
    estado = data.get('estado')
    idade = data.get('idade')
    imagem_url = data.get('imagem_url')

    if isinstance(imagem_url, str):
        imagem_url = imagem_url.strip()
        if not imagem_url:
            imagem_url = None
        elif imagem_url.startswith('data:image/'):
            if len(imagem_url) > 2_500_000:
                return jsonify({'message': 'Imagem muito grande. Tente uma imagem menor.'}), 400
        elif len(imagem_url) > 2048:
            return jsonify({'message': 'URL da imagem muito longa. Use um link público de imagem menor.'}), 400
    elif imagem_url is not None:
        return jsonify({'message': 'Formato de imagem inválido.'}), 400

    if not nome or not data_inicio:
        return jsonify({'message': 'Nome do evento e data de início são obrigatórios.'}), 400

    if formato is None:
        return jsonify({'message': 'Formato do evento inválido.'}), 400

    try:
        event_id = create_event(
            organizador_id=user_id,
            nome=nome,
            descricao=descricao,
            categoria=categoria,
            data_inicio=data_inicio,
            hora_inicio=hora_inicio,
            hora_fim=hora_fim,
            formato=formato,
            entrada=entrada,
            local_nome=local_nome,
            cidade=cidade,
            estado=estado,
            idade=idade,
            imagem_url=imagem_url,
        )
    except mysql.connector.Error:
        return jsonify({'message': 'Não foi possível salvar o evento com os dados informados.'}), 400

    return jsonify({'message': 'Evento criado com sucesso.', 'event_id': event_id}), 201


@app.route('/api/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event_route(event_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401

    data = request.json or {}

    formato = None
    if 'formato' in data:
        formato_raw = (data.get('formato') or '').strip().lower()
        formato_map = {
            'presencial': 'presencial',
            'online': 'online',
            'hibrido': 'híbrido',
            'híbrido': 'híbrido',
        }
        formato = formato_map.get(formato_raw)
        if formato is None:
            return jsonify({'message': 'Formato do evento inválido.'}), 400

    if 'nome' in data and not (data.get('nome') or '').strip():
        return jsonify({'message': 'Nome do evento não pode ficar vazio.'}), 400

    payload = {
        'nome': (data.get('nome') or '').strip() if 'nome' in data else None,
        'descricao': data.get('descricao') if 'descricao' in data else None,
        'categoria': data.get('categoria') if 'categoria' in data else None,
        'data_inicio': data.get('data_inicio') if 'data_inicio' in data else None,
        'hora_inicio': data.get('hora_inicio') if 'hora_inicio' in data else None,
        'hora_fim': data.get('hora_fim') if 'hora_fim' in data else None,
        'formato': formato if 'formato' in data else None,
        'entrada': (str(data.get('entrada') or '').strip().lower() if str(data.get('entrada') or '').strip().lower() in {'gratuito', 'pago'} else None) if 'entrada' in data else None,
        'local_nome': data.get('local_nome') if 'local_nome' in data else None,
        'cidade': data.get('cidade') if 'cidade' in data else None,
        'estado': data.get('estado') if 'estado' in data else None,
        'idade': data.get('idade') if 'idade' in data else None,
        'imagem_url': data.get('imagem_url') if 'imagem_url' in data else None,
    }

    if 'imagem_url' in data:
        imagem_url = payload['imagem_url']
        if isinstance(imagem_url, str):
            imagem_url = imagem_url.strip()
            if not imagem_url:
                imagem_url = None
            elif imagem_url.startswith('data:image/'):
                if len(imagem_url) > 2_500_000:
                    return jsonify({'message': 'Imagem muito grande. Tente uma imagem menor.'}), 400
            elif len(imagem_url) > 2048:
                return jsonify({'message': 'URL da imagem muito longa. Use um link público de imagem menor.'}), 400
            payload['imagem_url'] = imagem_url
        elif imagem_url is not None:
            return jsonify({'message': 'Formato de imagem inválido.'}), 400

    filtered_payload = {k: v for k, v in payload.items() if k in data}
    if not filtered_payload:
        return jsonify({'message': 'Nenhum campo válido para atualização.'}), 400

    updated = update_event(event_id=event_id, organizador_id=user_id, **filtered_payload)
    if not updated:
        return jsonify({'message': 'Evento não encontrado ou sem permissão.'}), 404

    event = get_event(event_id)
    return jsonify({'message': 'Evento atualizado com sucesso.', 'event': event.to_dict() if event else None}), 200


@app.route('/api/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event_route(event_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401

    deleted = delete_event(event_id=event_id, organizador_id=user_id)
    if not deleted:
        return jsonify({'message': 'Evento não encontrado ou sem permissão.'}), 404

    return jsonify({'message': 'Evento excluído com sucesso.'}), 200


@app.route('/api/events/<int:event_id>/subscribe', methods=['POST'])
@jwt_required()
def subscribe_event_route(event_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401

    user = get_user_by_id(user_id)
    if user is None:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    if str(user.tipo).lower() != 'pf':
        return jsonify({'message': 'Apenas usuários PF podem se inscrever em eventos.'}), 403

    subscribed = subscribe_user_to_event(event_id=event_id, usuario_id=user_id)
    result = (subscribed or {}).get('result')

    if result == 'event_not_found':
        return jsonify({'message': 'Evento não encontrado.'}), 404
    if result == 'already_subscribed':
        subscription_status = subscribed.get('status')
        if subscription_status == 'pendente_pagamento':
            return jsonify({
                'message': 'Você já possui uma inscrição pendente de pagamento para este evento.',
                'status': 'pendente_pagamento',
            }), 409
        return jsonify({'message': 'Você já está inscrito neste evento.', 'status': 'confirmado'}), 409

    if result == 'pending_payment':
        return jsonify({
            'message': 'Inscrição criada! Conclua o pagamento para confirmar sua vaga.',
            'status': 'pendente_pagamento',
            'payment_reference': subscribed.get('payment_reference'),
            'expires_em': subscribed.get('expires_em'),
            'checkout_url': f"/checkout/simulado?evento_id={event_id}",
        }), 202

    if result != 'confirmed':
        return jsonify({'message': 'Não foi possível iniciar sua inscrição agora.'}), 400

    event = get_event(event_id)
    inscritos_count = event.to_dict().get('inscritos_count', 0) if event else 0
    return jsonify({'message': 'Inscrição realizada com sucesso!', 'status': 'confirmado', 'inscritos_count': inscritos_count}), 201


@app.route('/api/events/<int:event_id>/subscribe/confirm-payment', methods=['POST'])
@jwt_required()
def confirm_payment_event_route(event_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401

    user = get_user_by_id(user_id)
    if user is None:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    if str(user.tipo).lower() != 'pf':
        return jsonify({'message': 'Apenas usuários PF podem confirmar pagamento de inscrição.'}), 403

    confirmation = confirm_subscription_payment(event_id=event_id, usuario_id=user_id)
    result = (confirmation or {}).get('result')

    if result == 'not_found':
        return jsonify({'message': 'Inscrição pendente não encontrada para este evento.'}), 404
    if result == 'already_confirmed':
        return jsonify({'message': 'Pagamento já confirmado para este evento.', 'status': 'confirmado'}), 200
    if result == 'expired':
        return jsonify({'message': 'Sua pendência de pagamento expirou. Gere uma nova inscrição para continuar.', 'status': 'expirado'}), 409
    if result == 'invalid_status':
        return jsonify({'message': 'Esta inscrição não está pendente de pagamento.'}), 409
    if result != 'confirmed':
        return jsonify({'message': 'Não foi possível confirmar o pagamento.'}), 400

    event = get_event(event_id)
    inscritos_count = event.to_dict().get('inscritos_count', 0) if event else 0
    return jsonify({'message': 'Pagamento confirmado! Inscrição efetivada.', 'status': 'confirmado', 'inscritos_count': inscritos_count}), 200


@app.route('/api/my-subscriptions', methods=['GET'])
@jwt_required()
def my_subscriptions_route():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401

    user = get_user_by_id(user_id)
    if user is None:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    if str(user.tipo).lower() != 'pf':
        return jsonify({'message': 'Apenas usuários PF possuem inscrições em eventos.'}), 403

    events = list_user_subscribed_events(user_id)
    return jsonify({'events': [event.to_dict() for event in events]}), 200


@app.route('/api/events/<int:event_id>/subscribe', methods=['DELETE'])
@jwt_required()
def unsubscribe_event_route(event_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({'message': 'Token inválido.'}), 401

    user = get_user_by_id(user_id)
    if user is None:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    if str(user.tipo).lower() != 'pf':
        return jsonify({'message': 'Apenas usuários PF podem cancelar inscrição.'}), 403

    removed = unsubscribe_user_from_event(event_id=event_id, usuario_id=user_id)
    if not removed:
        return jsonify({'message': 'Inscrição não encontrada para este evento.'}), 404

    return jsonify({'message': 'Inscrição cancelada com sucesso.'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
