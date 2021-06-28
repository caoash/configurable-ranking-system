import numbers

from flask import Blueprint, request, jsonify

from api.db import get_db

bp = Blueprint('auth', __name__, url_prefix='/api')


@bp.route('/<string:table>/<int:entry_id>')
def get_entry(table, entry_id):
    db = get_db()
    if table_not_exists(db, table):
        return
    return (db
            .execute('SELECT * from {table_name} WHERE id = ?'.format(table_name=table), (entry_id,))
            .fetchone())


@bp.route('/<string:table>/sorted')
def get_sorted(table):
    db = get_db()
    if table_not_exists(db, table):
        return
    entries = (db.execute('SELECT * from {table_name}'.format(table_name=table))
               .fetchall())
    criteria = request.args.keys()
    if len(criteria) > 0:
        entries.sort(reverse=True, key=lambda e: average_criteria(e, criteria))
    return jsonify(entries)


def average_criteria(e, criteria):
    total = 0
    for key, value in e.items():
        if isinstance(value, numbers.Number) and (key in criteria):
            total += value
    return total / len(criteria)


def table_not_exists(db, table):
    return (db.execute(
        'SELECT name FROM sqlite_master WHERE type="table" AND name=?', (table,))
            .fetchone()) is None
