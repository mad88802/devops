"""TEAM 12 - Fake Job Posting Detection : business-level web services.

Each UML class becomes a service (see the ECA architecture diagram):
Posting, Company, Salary, Fee, Content, Candidate, Report, plus the IT_Admin management (US8). US2 provides the Posting service
and the getter services used later by the ECA rule engine.
"""
import os

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from .db import close_connection, make_factory
from .engine.repository import DEFAULT_RULES_PATH, JsonRuleRepository, RuleLoadError
from .errors import ConflictError, NotFoundError, ValidationError
from .routes.admin_company_routes import bp as admin_company_bp
from .routes.admin_recruiter_routes import bp as admin_recruiter_bp
from .routes.check_routes import bp as check_bp
from .routes.company_routes import bp as company_bp
from .routes.escalation_routes import bp as escalation_bp
from .routes.posting_routes import bp as posting_bp
from .routes.report_routes import bp as report_bp


def create_app(config=None):
    app = Flask(__name__)
    app.config.update(
        DB_BACKEND=os.getenv("DB_BACKEND", "mysql"),   # "mysql" or "sqlite" (tests)
        MYSQL_HOST=os.getenv("MYSQL_HOST", "127.0.0.1"),
        MYSQL_PORT=int(os.getenv("MYSQL_PORT", "3306")),
        MYSQL_USER=os.getenv("MYSQL_USER", "root"),
        MYSQL_PASSWORD=os.getenv("MYSQL_PASSWORD", ""),
        MYSQL_DATABASE=os.getenv("MYSQL_DATABASE", "jobwatch"),
        SQLITE_PATH=os.getenv("SQLITE_PATH", "jobwatch.db"),
        RULES_PATH=os.getenv("RULES_PATH", DEFAULT_RULES_PATH),
    )
    app.json.sort_keys = False          # keep the natural field order in responses
    if config:
        app.config.update(config)
    app.config.setdefault("DB_FACTORY", make_factory(app.config))
    JsonRuleRepository(app.config["RULES_PATH"]).load()    # fail fast on an invalid rule file

    app.register_blueprint(posting_bp, url_prefix="/api")
    app.register_blueprint(company_bp, url_prefix="/api")
    app.register_blueprint(check_bp, url_prefix="/api")
    app.register_blueprint(report_bp, url_prefix="/api")
    app.register_blueprint(escalation_bp, url_prefix="/api")
    app.register_blueprint(admin_company_bp, url_prefix="/api")
    app.register_blueprint(admin_recruiter_bp, url_prefix="/api")
    app.teardown_appcontext(close_connection)

    @app.errorhandler(ValidationError)
    def _validation(err):
        return jsonify(error="validation_failed", details=err.details), 422

    @app.errorhandler(RuleLoadError)
    def _bad_rules(err):
        app.logger.error("rule repository problem: %s", err)
        return jsonify(error="rules_unavailable", message=str(err)), 500

    @app.errorhandler(ConflictError)
    def _conflict(err):
        return jsonify(error="conflict", message=str(err)), 409

    @app.errorhandler(NotFoundError)
    def _not_found(err):
        return jsonify(error="not_found", message=str(err)), 404

    @app.errorhandler(HTTPException)
    def _http(err):
        return jsonify(error=err.name.lower().replace(" ", "_"), message=err.description), err.code

    @app.errorhandler(Exception)
    def _unexpected(err):
        app.logger.exception("unexpected error")
        return jsonify(error="internal_error", message="unexpected server error"), 500

    return app
