from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from api.utils import require_current_user_id, service_error_response
from services.errors import ServiceError
from services.profile_service import get_profile_data, update_avatar_data, update_profile_data

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    try:
        user_id = require_current_user_id()
        return jsonify(get_profile_data(user_id)), 200
    except ServiceError as error:
        return service_error_response(error)


@profile_bp.route('/api/profile', methods=['PUT'])
@jwt_required()
def profile_update():
    try:
        user_id = require_current_user_id()
        return jsonify(update_profile_data(user_id, request.json or {})), 200
    except ServiceError as error:
        return service_error_response(error)


@profile_bp.route('/api/profile/avatar', methods=['PUT'])
@jwt_required()
def profile_avatar_update():
    try:
        user_id = require_current_user_id()
        return jsonify(update_avatar_data(user_id, request.json or {})), 200
    except ServiceError as error:
        return service_error_response(error)