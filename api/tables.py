import json
import math

from flask import Blueprint, request, jsonify

try:
    from db import get_db
except ImportError:
    from api.db import get_db

bp = Blueprint('auth', __name__, url_prefix='/api/table')

# Explanation of current model:
# tables and fields CANNOT be named by the user because of sql injection stuff,
# instead the tables are given numbers that are associated with the names through the 'tables' table
# A data_table is a user made table that holds information to be sorted by criteria.
# Data tables are stored in 3 parts: the entries, the fields, and the general table info

# identifiers for database parts
TABLE_LIST = 'tables'
INFO = 'info_'
ENTRIES = 'entries_'
FIELDS = 'fields_'
FIELD = 'col'

# error messages
TABLE_EXISTS = 'Table already exists'
FIELD_EXISTS = 'Field already exists'
FIELD_DOESNT_EXIST = 'Cannot operate on a field that doesn\'t exist'
TABLE_DOESNT_EXIST = 'Cannot operate on a table that doesn\'t exist'

# sql commands
ID_DEFINITION = 'id INTEGER PRIMARY KEY AUTOINCREMENT'

CREATE_TABLE_LIST = f'''
CREATE TABLE {TABLE_LIST} (
    {ID_DEFINITION},
    name TEXT NOT NULL UNIQUE
)
'''

CREATE_DATA_TABLE_INFO = f'''
CREATE TABLE {{table_name}} (
    {ID_DEFINITION},
    name TEXT,
    description TEXT
)
'''

CREATE_DATA_TABLE_ENTRIES = f'''
CREATE TABLE {{table_name}} (
    {ID_DEFINITION}
)
'''

CREATE_DATA_TABLE_FIELDS = f'''
CREATE TABLE {{table_name}} (
    {ID_DEFINITION},
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    isData INTEGER,
    isAscending INTEGER
)
'''

INSERT_FIELD = '''
INSERT INTO {field_table} 
    (name, description, isData, isAscending)
VALUES
    (?, ?, ?, ?)
'''

PAGE_SIZE = 25
MAX_ADDED_ENTRIES = 25


@bp.route('/<string:table>/<int:entry_id>')
def get_entry(table, entry_id):
    return (get_db()
            .execute(f'SELECT * FROM {ENTRIES + get_table_id(table)} WHERE id = ?', (entry_id,))
            .fetchone())


@bp.route('/<string:table>/add-entries', methods=('POST',))
def add_entries(table):
    entry_fields_list = json.loads(request.headers['entryFields'])  # dict of fields for entry
    if len(entry_fields_list) > MAX_ADDED_ENTRIES:
        raise Exception(f'Can\'t add more than {MAX_ADDED_ENTRIES} entries')
    db = get_db()
    for entry_fields in entry_fields_list:
        table_id = get_table_id(table)
        table_fields = db.execute(f'SELECT * FROM {FIELDS + table_id}').fetchall()
        if not len(table_fields):
            raise Exception('Must add a field before adding entries')
        fields_tuple = ()
        for field in table_fields:
            data = entry_fields.get(field['name'])
            if field['isData']:
                try:
                    fields_tuple += (float(data),)
                except (ValueError, TypeError):
                    fields_tuple += (None,)
            else:
                fields_tuple += (data,)
        db.execute('INSERT INTO {entry_table} ({field_names}) VALUES ({question_marks})'.format(
            entry_table=ENTRIES + table_id,
            field_names=str.join(', ', [FIELD + str(e['id']) for e in table_fields]),
            question_marks=('?, ' * len(fields_tuple))[:-2]
        ), fields_tuple)
    db.commit()
    return 'Entry added'


@bp.route('/<string:table>/<int:entry_id>/edit', methods=('PUT',))
def edit_entry(table, entry_id):
    entry_fields = json.loads(request.headers['entryFields'])  # dict of fields for entry
    db = get_db()
    table_id = get_table_id(table)
    table_fields = db.execute(f'SELECT name, isData FROM {FIELDS + table_id}').fetchall()
    fields_tuple = ()
    for field in table_fields.copy():
        data = entry_fields.get(field['name'])
        if data is None:
            table_fields.remove(field)
            continue
        if field['isData']:
            try:
                fields_tuple += (float(data),)
            except ValueError:
                raise Exception('Could not convert string to numeric')
        else:
            fields_tuple += (data,)
    db.execute('UPDATE {entry_table} SET {field_names} WHERE id=?'.format(
        entry_table=ENTRIES + table_id,
        field_names=str.join('=?, ', [get_field_id(table, e['name']) for e in table_fields]) + '=?',
    ), fields_tuple + (entry_id,))
    db.commit()
    return 'Entry edited'


@bp.route('/<string:table>/<int:entry_id>/delete', methods=('DELETE',))
def delete_entry(table, entry_id):
    get_db().execute(f'DELETE FROM {ENTRIES + get_table_id(table)} where id=?', (entry_id,))
    get_db().commit()
    return 'Entry deleted'


@bp.route('/<string:table>/entries')
def get_entries(table):
    criteria = request.args.get('sort')
    weights = request.args.get('fieldWeights')
    page = request.args.get('page')  # page starts at 1
    if page is None:
        page = 1
    db = get_db()
    table_id = get_table_id(table)
    entries = db.execute(f'SELECT * FROM {ENTRIES + table_id}').fetchall()
    table_fields = db.execute(f'SELECT * FROM {FIELDS + table_id}').fetchall()
    for field in table_fields:
        for i in range(len(entries)):
            entries[i][field['name']] = entries[i].pop(FIELD + str(field['id']))
    if criteria is not None:
        max_entries = {}
        min_entries = {}
        field_info = {}
        for field in table_fields:
            field_info[field['name']] = field
            max_entries[field['name']] = get_single_result(
                db.execute(f'SELECT MAX({get_field_id(table, field["name"])}) FROM {ENTRIES + table_id}'))
            min_entries[field['name']] = get_single_result(
                db.execute(f'SELECT MIN({get_field_id(table, field["name"])}) FROM {ENTRIES + table_id}'))
        weights_list = []
        criteria_list = criteria.split(',')
        if weights is None:
            weights_list = [1] * len(criteria_list)
        else:
            weights_list = [float(w) if w != 'NaN' else 0 for w in weights.split(',')]
        if len(weights_list) != len(criteria_list):
            raise Exception('List of weights needs to be equal in length to list of selected criteria')
        entries.sort(reverse=True, key=lambda e: average_criteria(
            e, criteria_list, weights_list,
            field_info,
            max_entries, min_entries)
         )
    start = PAGE_SIZE * (int(page) - 1)
    if start >= len(entries):
        return jsonify([])
    end = min(len(entries), start + 25)
    return jsonify(entries[start:end])


@bp.route('/<string:table>/entry-count')
def entry_count(table):
    return jsonify(get_single_result(get_db().execute(f'SELECT COUNT(*) FROM {ENTRIES + get_table_id(table)}')))


@bp.route('/<string:table>/page-count')
def page_count(table):
    return jsonify(math.ceil(
        get_single_result(get_db().execute(f'SELECT COUNT(*) FROM {ENTRIES + get_table_id(table)}')) / PAGE_SIZE))


@bp.route('/<string:table>/info')
def get_table_info(table):
    return {**{'name': table}, **get_db().execute(f'SELECT * FROM {INFO + get_table_id(table)}').fetchone()}


@bp.route('/tables')
def get_table_list():
    db = get_db()
    return jsonify([get_table_info(e['name']) for e in db.execute(f'SELECT name FROM {TABLE_LIST}').fetchall()])


@bp.route('/<string:table>/exists')
def exists(table):
    return str(data_table_exists(table))


@bp.route('/create', methods=('POST',))
def create_table():
    table = request.headers['tableName']
    view_name = request.headers.get('viewName')
    description = request.headers.get('tableDescription')
    if data_table_exists(table):
        raise Exception(TABLE_EXISTS)
    else:
        db = get_db()
        db.execute(f'INSERT INTO {TABLE_LIST} (name) VALUES (?)', (table,))
        table_id = get_table_id(table)
        db.execute(CREATE_DATA_TABLE_INFO.format(table_name=INFO + table_id))
        db.execute(f'INSERT INTO {INFO + table_id} (name, description) VALUES (?, ?)', (view_name, description))
        db.execute(CREATE_DATA_TABLE_ENTRIES.format(table_name=ENTRIES + table_id))
        db.execute(CREATE_DATA_TABLE_FIELDS.format(table_name=FIELDS + table_id))
        db.commit()
    return table + ' created'


@bp.route('/<string:table>/edit', methods=('PUT',))
def update_table_info(table):
    description = request.headers.get('newDescription')
    view_name = request.headers.get('newViewName')
    db = get_db()
    if description is not None:
        db.execute(f'UPDATE {INFO + get_table_id(table)} SET description=?', (description,))
    if view_name is not None:
        db.execute(f'UPDATE {INFO + get_table_id(table)} SET name=?', (view_name,))
    db.commit()
    return table + ' edited'


@bp.route('/<string:table>/delete', methods=('DELETE',))
def delete_table(table):
    db = get_db()
    table_id = get_table_id(table)
    db.execute(f'DELETE FROM {TABLE_LIST} WHERE id=?', (table_id,))
    db.execute('DROP TABLE ' + INFO + table_id)
    db.execute('DROP TABLE ' + ENTRIES + table_id)
    db.execute('DROP TABLE ' + FIELDS + table_id)
    db.commit()
    return table + ' deleted'


@bp.route('/<string:table>/fields')
def fields(table):
    return jsonify(get_db().execute(f'SELECT * FROM {FIELDS + get_table_id(table)}').fetchall())


@bp.route('/<string:table>/add-field', methods=('POST',))
def add_field(table):
    name = request.headers['fieldName']
    description = request.headers.get('fieldDescription')
    # whether the field is data for calculations or info (like college name)
    is_data = int(request.headers['fieldIsData'].lower() == 'true')
    # whether lower values are better
    is_ascending = int(request.headers['fieldIsAscending'].lower() == 'true')
    if field_exists(table, name):
        raise Exception(FIELD_EXISTS)
    else:
        db = get_db()
        table_id = get_table_id(table)
        db.execute(INSERT_FIELD.format(
            field_table=FIELDS + table_id),
            (name, description, is_data, is_ascending)
        )
        db.execute('ALTER TABLE {entries_table} ADD COLUMN {field_id} {data_type}'.format(
            entries_table=ENTRIES + table_id,
            field_id=get_field_id(table, name),
            data_type='FLOAT' if is_data else 'TEXT'
        ))
        db.commit()
    return 'Field added'


@bp.route('/<string:table>/<string:field>/edit', methods=('PUT',))
def edit_field(table, field):
    new_name = request.headers.get('newFieldName')
    new_description = request.headers.get('newFieldDescription')
    is_ascending = int(request.headers.get('newFieldIsAscending').lower() == 'true')
    if not field_exists(table, field):
        raise Exception(FIELD_DOESNT_EXIST)
    if field_exists(table, new_name):
        raise Exception(FIELD_EXISTS)
    db = get_db()
    if new_description is not None:
        db.execute(f'UPDATE {FIELDS + get_table_id(table)} SET description=? WHERE name=?', (new_description, field))
    if is_ascending is not None:
        db.execute(f'UPDATE {FIELDS + get_table_id(table)} SET isAscending=? WHERE name=?', (is_ascending, field))
    if new_name is not None:
        db.execute(f'UPDATE {FIELDS + get_table_id(table)} SET name=? WHERE name=?', (new_name, field))
    db.commit()
    return 'Field edited'


@bp.route('/<string:table>/<string:field>/delete', methods=('DELETE',))
def delete_field(table, field):
    db = get_db()
    # db.execute('ALTER TABLE {entries_table} DROP COLUMN {field_id}'.format(
    #     entries_table=ENTRIES + get_table_id(table),
    #     field_id=get_field_id(table, field)
    # ))
    # apparently drop column isn't supported well... here's an ugly workaround
    table_id = get_table_id(table)
    table_info = db.execute(f'PRAGMA table_info({ENTRIES + table_id})').fetchall()
    command = '''BEGIN TRANSACTION;
        CREATE TEMPORARY TABLE t1_backup({remaining_columns});
        INSERT INTO t1_backup SELECT {remaining_columns} FROM {entries_table};
        DROP TABLE {entries_table};
        CREATE TABLE {entries_table}({column_definitions});
        INSERT INTO {entries_table} SELECT {remaining_columns} FROM t1_backup;
        DROP TABLE t1_backup;
        COMMIT;'''.format(
        remaining_columns=', '.join(sorted({e['name'] for e in table_info} - {get_field_id(table, field)})),
        column_definitions=', '.join(sorted({f'{e["name"]} {e["type"]}'
                                             for e in table_info if not
                                             (e['name'] == 'id' or e['name'] == get_field_id(table, field))}
                                            .union({ID_DEFINITION}))),
        entries_table=ENTRIES + table_id)
    for line in command.splitlines():
        db.execute(line)
    db.execute(f'DELETE FROM {FIELDS + table_id} WHERE name=?', (field,))
    db.commit()
    return 'Field deleted'


def average_criteria(e, criteria, weights, field_info, max_entries, min_entries):
    total = 0
    for key, value in e.items():
        try:
            index = criteria.index(key)
            if key != 'id' and bool(field_info[key]['isData']):
                weight = weights[index] * (-1 if bool(field_info[key]['isAscending']) else 1)
                if value is not None:
                    total += weight * (value - min_entries[key]) / (max_entries[key] - min_entries[key])
                else:
                    if weight < 0:
                        total += weight
                    total -= 0.0001  # to differentiate between the lowest value
        except ValueError:
            pass
    return total


def data_table_exists(table):
    db = get_db()
    if table_exists(TABLE_LIST):
        return db.execute(f'SELECT name FROM {TABLE_LIST} WHERE name=?', (table,)).fetchone() is not None
    else:
        db.execute(CREATE_TABLE_LIST)
        db.commit()
        return False


def table_exists(table):
    db = get_db()
    return db.execute('SELECT name FROM sqlite_master WHERE type="table" AND name=?', (table,)).fetchone() is not None


def get_field_names(table):
    return [field['name'] for field in get_db().execute(f'SELECT name FROM {FIELDS + get_table_id(table)}').fetchall()]


def field_exists(table, field_name):
    return get_db().execute(f'SELECT name FROM {FIELDS + get_table_id(table)} WHERE name=?', (field_name,)) \
               .fetchone() is not None


def get_field_id(table, field_name):
    db = get_db()
    result = db.execute(f'SELECT * FROM {FIELDS + get_table_id(table)} WHERE name=?', (field_name,)).fetchone()
    if result is None:
        raise Exception(FIELD_DOESNT_EXIST)
    else:
        return FIELD + str(result['id'])


def get_table_id(table):
    db = get_db()
    result = db.execute(f'SELECT * FROM {TABLE_LIST} WHERE name=?', (table,)).fetchone()
    if result is None:
        raise Exception(TABLE_DOESNT_EXIST)
    else:
        return str(result['id'])


def get_single_result(cursor):
    return list(cursor.fetchone().values())[0]
