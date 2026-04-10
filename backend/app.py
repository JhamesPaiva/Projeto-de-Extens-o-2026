from flask import Flask, request, jsonify
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
)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

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

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user': user.to_public_dict(),
    }), 200

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if user is None:
        return jsonify({'message': 'Usuário não encontrado.'}), 404
    return jsonify(user.to_public_dict()), 200

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def profile_update():
    user_id = get_jwt_identity()
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

@app.route('/api/events', methods=['GET'])
def events_list():
    filtros = {
        'categoria': request.args.get('categoria'),
        'cidade': request.args.get('cidade'),
        'estado': request.args.get('estado'),
        'formato': request.args.get('formato'),
        'organizador_id': request.args.get('organizador_id'),
        'search': request.args.get('search'),
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
    user_id = get_jwt_identity()
    data = request.json or {}

    nome = (data.get('nome') or '').strip()
    descricao = data.get('descricao')
    categoria = data.get('categoria')
    data_inicio = data.get('data_inicio')
    hora_inicio = data.get('hora_inicio')
    hora_fim = data.get('hora_fim')
    formato = (data.get('formato') or 'presencial').strip().lower()
    local_nome = data.get('local_nome')
    cidade = data.get('cidade')
    estado = data.get('estado')
    idade = data.get('idade')
    imagem_url = data.get('imagem_url')

    if not nome or not data_inicio:
        return jsonify({'message': 'Nome do evento e data de início são obrigatórios.'}), 400

    event_id = create_event(
        organizador_id=user_id,
        nome=nome,
        descricao=descricao,
        categoria=categoria,
        data_inicio=data_inicio,
        hora_inicio=hora_inicio,
        hora_fim=hora_fim,
        formato=formato,
        local_nome=local_nome,
        cidade=cidade,
        estado=estado,
        idade=idade,
        imagem_url=imagem_url,
    )

    return jsonify({'message': 'Evento criado com sucesso.', 'event_id': event_id}), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
