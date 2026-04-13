from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from api.utils import require_current_user_id, service_error_response
from services.errors import ServiceError
from services.event_service import (
    confirm_subscription_for_user,
    create_event_for_user,
    delete_event_for_user,
    get_event_detail,
    list_events_data,
    list_user_subscriptions_data,
    subscribe_user,
    unsubscribe_user,
    update_event_for_user,
)

event_bp = Blueprint('events', __name__)


@event_bp.route('/api/events', methods=['GET'])
def events_list():
    try:
        return jsonify({'events': list_events_data(request.args)}), 200
    except ServiceError as error:
        return service_error_response(error)


@event_bp.route('/api/events/<int:event_id>', methods=['GET'])
def event_detail(event_id):
    try:
        return jsonify(get_event_detail(event_id)), 200
    except ServiceError as error:
        return service_error_response(error)


@event_bp.route('/api/events', methods=['POST'])
@jwt_required()
def create_event_route():
    try:
        user_id = require_current_user_id()
        result = create_event_for_user(user_id, request.json or {})
        return jsonify(result), 201
    except ServiceError as error:
        return service_error_response(error)


@event_bp.route('/api/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event_route(event_id):
    try:
        user_id = require_current_user_id()
        result = update_event_for_user(user_id, event_id, request.json or {})
        return jsonify(result), 200
    except ServiceError as error:
        return service_error_response(error)


@event_bp.route('/api/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event_route(event_id):
    try:
        user_id = require_current_user_id()
        result = delete_event_for_user(user_id, event_id)
        return jsonify(result), 200
    except ServiceError as error:
        return service_error_response(error)


@event_bp.route('/api/events/<int:event_id>/subscribe', methods=['POST'])
@jwt_required()
def subscribe_event_route(event_id):
    try:
        user_id = require_current_user_id()
        result, status_code = subscribe_user(user_id, event_id)
        return jsonify(result), status_code
    except ServiceError as error:
        return service_error_response(error)


@event_bp.route('/api/events/<int:event_id>/subscribe/confirm-payment', methods=['POST'])
@jwt_required()
def confirm_payment_event_route(event_id):
    try:
        user_id = require_current_user_id()
        result, status_code = confirm_subscription_for_user(user_id, event_id)
        return jsonify(result), status_code
    except ServiceError as error:
        return service_error_response(error)


@event_bp.route('/api/my-subscriptions', methods=['GET'])
@jwt_required()
def my_subscriptions_route():
    try:
        user_id = require_current_user_id()
        return jsonify({'events': list_user_subscriptions_data(user_id)}), 200
    except ServiceError as error:
        return service_error_response(error)


@event_bp.route('/api/events/<int:event_id>/subscribe', methods=['DELETE'])
@jwt_required()
def unsubscribe_event_route(event_id):
    try:
        user_id = require_current_user_id()
        result = unsubscribe_user(user_id, event_id)
        return jsonify(result), 200
    except ServiceError as error:
        return service_error_response(error)