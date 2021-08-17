"""
The backend of the configurable-ranking-system
Uses Flask

__init__.py initializes the app
db.py stores basic database connection related methods
tables.py stores all api routes for interacting with tables (details included there)

General API model (not necessarily representative of the actual backend implementation):
-   Data table
    -   tableName
    -   viewName
    -   tableDescription
    -   fields
        -   fieldName
        -   fieldDescription
        -   isData
        -   fieldIsAscending
    -   entryCount
    -   entries
        -   values
        -   ^for
        -   ^each
        -   ^field
"""
import os

from flask import Flask
from flask_cors import CORS  # CORS stuff is development only


def create_app(test_config=None):
    """
    :param test_config: Optionally used for test_config
    :return: The Flask app
    """
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

    from . import db
    db.init_app(app)

    from . import tables
    app.register_blueprint(tables.bp)

    return app
