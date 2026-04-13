from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from services.errors import ServiceError


def get_current_user_id():
    identity = get_jwt_identity()
    try:
        return int(identity)
    except (TypeError, ValueError):
        return None


def require_current_user_id():
    user_id = get_current_user_id()
    if user_id is None:
        raise ServiceError('Token inválido.', status_code=401)
    return user_id


def service_error_response(error):
    payload = {'message': error.message}
    if error.extra_payload:
        payload.update(error.extra_payload)
    return jsonify(payload), error.status_code