import os

from flask import Flask
from flask_cors import CORS  # CORS stuff is development only


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.debug = True

    CORS(app)
    app.config.from_mapping(
        SECRET_KEY='test',
        DATABASE=os.path.join(app.instance_path, 'api.sqlite')
    )

    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    @app.route('/api/status')
    def status():
        return 'API Online'

    from . import db
    db.init_app(app)

    from . import tables
    app.register_blueprint(tables.bp)

    return app
