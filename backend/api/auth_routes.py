from flask import Blueprint, jsonify, request

from api.utils import service_error_response
from services.auth_service import login_user, register_user
from services.errors import ServiceError

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/register', methods=['POST'])
def register():
    try:
        user_id = register_user(request.json or {})
        return jsonify({'message': 'Registro concluído.', 'user_id': user_id}), 201
    except ServiceError as error:
        return service_error_response(error)


@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        result = login_user(request.json or {})
        return jsonify(result), 200
    except ServiceError as error:
        return service_error_response(error)