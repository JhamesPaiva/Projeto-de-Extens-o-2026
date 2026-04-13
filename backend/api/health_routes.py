from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)


@health_bp.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok', 'message': 'Backend Python rodando'}), 200