"""
Stores convenience methods for working with database connections.
"""
import sqlite3

from flask import current_app, g


def dict_factory(cursor, row):
    """So that database entries are retrieved as dicts"""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


def get_db():
    """Utility method for quickly fetching connection"""
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = dict_factory
    return g.db


def close_db(e=None):
    """Close the database"""
    db = g.pop('db', None)
    if db is not None:
        db.commit()
        db.close()
    return 'CLOSED'


def init_app(app):
    """Initialize the app with database config"""
    app.teardown_appcontext(close_db)
    app.teardown_request(close_db)
    return 'DONE'
