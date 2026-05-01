from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from api.auth_routes import auth_bp
from api.event_routes import event_bp
from api.health_routes import health_bp
from api.profile_routes import profile_bp
from config import Config


def create_app():
    app = Flask(__name__)
    Config.validate_security()
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(event_bp)

    return app