"""
Routes all the different api requests related to the tables. Tables are user created and store data that can be ranked.

Explanation of current model (model will change to use SqlAlchemy and remove redundant tables):
-   User made tables and columns are stored in the database with ids and are referred to here as data tables
-   The 'tables' table stores data table ids with their respective names
-   Each data table is stored in 3 parts:
-   fields_<id> stores a list of each user column and its associated data
-   entries_<id> stores the actual entries
-   info_<id> stores the info for the table
-   All the column info and table info could be stored in single tables instead of the current system
    (this will be changed)

All the api methods return json. See https://flask.palletsprojects.com/en/2.0.x/api/#url-route-registrations for
url routing in Flask which should make the function headers more self explanatory. All methods taking in a parameter
table are expecting the table's name not id within the database.
"""
import json
import math

from flask import Blueprint, request, jsonify

try:
    from db import get_db
except ImportError:
    from api.db import get_db

bp = Blueprint('auth', __name__, url_prefix='/api')

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
    viewName TEXT,
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


@bp.route('/table/<string:table>/<int:entry_id>')
def get_entry(table, entry_id):
    """Fetch an entry from a data table by its id"""
    return (get_db()
            .execute(f'SELECT * FROM {ENTRIES + get_table_id(table)} WHERE id = ?', (entry_id,))
            .fetchone())


@bp.route('/table/<string:table>/add-entries', methods=('POST',))
def add_entries(table):
    """Add an entry to a data table. Requires a header 'entryFields' that stores a json dict of field names and their
    associated value. Cannot add more than MAX_ADDED_ENTRIES at a time."""
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


@bp.route('/table/<string:table>/<int:entry_id>/edit', methods=('PUT',))
def edit_entry(table, entry_id):
    """Edit an entry in a data table according to its id. Requires a header 'entryFields' that stores a json dict of
    field names and their associated value."""
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


@bp.route('/table/<string:table>/<int:entry_id>/delete', methods=('DELETE',))
def delete_entry(table, entry_id):
    """Delete an entry from a data table by its id."""
    get_db().execute(f'DELETE FROM {ENTRIES + get_table_id(table)} where id=?', (entry_id,))
    get_db().commit()
    return 'Entry deleted'


@bp.route('/table/<string:table>/entries')
def get_entries(table):
    """Retrieve entries from a data table ranked according to data fields.
    Returns a dict:
        entries - list of entries
        total - number of entries (according to filter)
        pageCount - number of pages (according to filter)
    Notes:
    -   Ranking entries happens by normalizing all data fields to be between 0 and 1 and then adding the fields
        together. Fields have a default sorting direction (by multiplying the weight by -1).
        Empty fields (None) are penalized as the minimum value).
    Query parameters:
    -   Include 'fieldWeights' to weight the different field ids. fieldWeights should include weights
        for all fields, even those with isData false. Weights are in order of the field ids.
    -   Include 'page' for pagination. A page has PAGE_SIZE entries. Pages start at 1.
    -   Include 'filter' to filter the entries. filter is a json object: each property (optional) is a field id and its
        associated filter. If the field isData then a min and max property can be specified as the filter. If not isData
        then a list of substrings can be specified where an entry is included if the field matches any of the substrings
        included.
    """
    weights = request.args.get('fieldWeights')
    page = request.args.get('page')
    filters_json = request.args.get('filter')  # expects a json object of each field id and its associated filter,
    # if isData is true then it expects a min and max value, otherwise a list of substrings to check for
    if page is None:
        page = 1
    db = get_db()
    table_id = get_table_id(table)
    table_fields = db.execute(f'SELECT * FROM {FIELDS + table_id}').fetchall()
    select = f'SELECT * FROM {ENTRIES + table_id} WHERE '
    placeholders = ()
    splice = False
    if filters_json is not None:
        filters = json.loads(filters_json)
        for field in table_fields:
            field_id = str(field['id'])
            if field_id in filters:
                if field['isData']:
                    if 'min' in filters[field_id]:
                        select += f'{FIELD + field_id} >= ? AND '
                        placeholders += (filters[field_id]['min'],)
                        splice = True
                    elif 'max' in filters[field_id]:
                        select += f'{FIELD + field_id} <= ? AND '
                        placeholders += (filters[field_id]['max'],)
                        splice = True
                else:
                    queries = []
                    for substring in filters[field_id].get('substrings', []):
                        queries.append(f'{FIELD + field_id} LIKE ?')
                        placeholders += (f'%{substring}%',)
                    if len(queries):
                        select += f'({str.join(" OR ", queries)}) AND '
                        splice = True
    if splice:
        select = select[:-4]  # remove extra AND
    else:
        select = select[:-7]  # remove extra WHERE
    entries = db.execute(select, placeholders).fetchall()
    max_entries = []
    min_entries = []
    # todo this could be optimized so that the values are stored in the fields tables and then invalidated when
    #  the entries are changed
    for field in table_fields:
        field_id = get_field_id(table, field['name'])
        max_entries.append(get_single_result(
            db.execute(f'SELECT MAX({field_id}) FROM {ENTRIES + table_id}')))
        min_entries.append(get_single_result(
            db.execute(f'SELECT MIN({field_id}) FROM {ENTRIES + table_id}')))
    weights_list = []
    if weights is None:
        weights_list = [1] * len(table_fields)
    else:
        weights_list = [float(w) if w != 'NaN' or not len(w) else 0 for w in weights.split(',')]
    if len(weights_list) != len(table_fields):  # accounting for id
        raise Exception('List of weights needs to be equal to the number of fields')
    entries.sort(reverse=True, key=lambda e: criteria_value(
        e, weights_list,
        table_fields,
        max_entries, min_entries)
                 )
    start = PAGE_SIZE * (int(page) - 1)
    end = min(len(entries), start + 25)
    total_length = len(entries)
    if start >= len(entries) and len(entries):
        entries = []
    else:
        entries = entries[start:end]
    for field in table_fields:
        for i in range(len(entries)):
            entries[i][field['name']] = entries[i].pop(FIELD + str(field['id']))
    return jsonify({
        "total": total_length,
        "pageCount": math.ceil(total_length / PAGE_SIZE),
        "entries": entries
    })


@bp.route('/table/<string:table>/info')
def get_table_info(table):
    """Returns the table info of a data table. This includes all properties of the actual table info, including a
    list of fields, and an entry count. Look at the create_table method for details on actual table info."""
    fields = get_db().execute(f'SELECT * FROM {FIELDS + get_table_id(table)}').fetchall()
    entry_count = get_single_result(get_db().execute(f'SELECT COUNT(*) FROM {ENTRIES + get_table_id(table)}'))
    return {
        **{'name': table}, **get_db().execute(f'SELECT * FROM {INFO + get_table_id(table)}').fetchone(),
        "fields": fields,
        "entryCount": entry_count
    }


@bp.route('/tables')
def get_table_list():
    """Get a list of all data tables. Uses get_table_info"""
    db = get_db()
    return jsonify([get_table_info(e['name']) for e in db.execute(f'SELECT name FROM {TABLE_LIST}').fetchall()])


@bp.route('/table/<string:table>/exists')
def exists(table):
    """Returns whether a table name matches any data table"""
    return str(data_table_exists(table))


@bp.route('/table/create', methods=('POST',))
def create_table():
    """Create a data table
    Request headers:
    -   Requires 'tableName' which must be unique
    -   Optional 'viewName' will be shown to users, not unique
    -   Optional 'tableDescription' description for table
    """
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
        db.execute(f'INSERT INTO {INFO + table_id} (name, viewName, description) VALUES (?, ?, ?)',
                   (table, view_name, description))
        db.execute(CREATE_DATA_TABLE_ENTRIES.format(table_name=ENTRIES + table_id))
        db.execute(CREATE_DATA_TABLE_FIELDS.format(table_name=FIELDS + table_id))
        db.commit()
    return table + ' created'


@bp.route('/table/<string:table>/edit', methods=('PUT',))
def update_table_info(table):
    """Update a data table's info
    Request headers:
    -   Optional 'newDescription' see create_table for usage
    -   Optional 'newViewName' see create_table for usage
    """
    description = request.headers.get('newDescription')
    view_name = request.headers.get('newViewName')
    db = get_db()
    if description is not None:
        db.execute(f'UPDATE {INFO + get_table_id(table)} SET description=?', (description,))
    if view_name is not None:
        db.execute(f'UPDATE {INFO + get_table_id(table)} SET name=?', (view_name,))
    db.commit()
    return table + ' edited'


@bp.route('/table/<string:table>/delete', methods=('DELETE',))
def delete_table(table):
    """Delete a table"""
    db = get_db()
    table_id = get_table_id(table)
    db.execute(f'DELETE FROM {TABLE_LIST} WHERE id=?', (table_id,))
    db.execute('DROP TABLE ' + INFO + table_id)
    db.execute('DROP TABLE ' + ENTRIES + table_id)
    db.execute('DROP TABLE ' + FIELDS + table_id)
    db.commit()
    return table + ' deleted'


@bp.route('/table/<string:table>/add-field', methods=('POST',))
def add_field(table):
    """Add a field to a data table
    Request headers:
    -   Required 'fieldName' name of the field (must be unique within the data table)
    -   Optional 'fieldDescription' description of the field
    -   Required 'isData' specifies whether the field is just entry info or is a number meant to be used as criteria.
        Pass in 'true' to set isData to 'true' (no quotations).
        isData true means that the field expects numbers while false stores the field as a string.
    -   Required 'fieldIsAscending' specifies the default sort direction of the field. 'true' means that
        small values are more favorable.
    """
    name = request.headers['fieldName']
    description = request.headers.get('fieldDescription')
    is_data = int(request.headers['fieldIsData'].lower() == 'true')
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


@bp.route('/table/<string:table>/<string:field>/edit', methods=('PUT',))
def edit_field(table, field):
    """Edit an existing field of a data table
    Request headers (all optional see add_field for descriptions):
    -   'newFieldName' analogous to 'fieldName'
    -   'newFieldDescription' analogous to 'fieldDescription'
    -   'newFieldIsAscending' analogous to 'fieldIsAscending'
    """
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


@bp.route('/table/<string:table>/<string:field>/delete', methods=('DELETE',))
def delete_field(table, field):
    """Delete a field of a data table."""
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


def criteria_value(e, weights, field_info, max_entries, min_entries):
    """Get the value of an entry according to criteria criteria. Entries are then sorted by this value. Higher is 
    better. """
    total = 0
    i = 0
    for field in field_info:
        if field['name'] != 'id' and bool(field['isData']):
            if weights[i] != 0:
                weight = weights[i] * (-1 if bool(field['isAscending']) else 1)
                value = e[FIELD + str(field['id'])]
                if value is not None:
                    total += weight * (value - min_entries[i]) / (max_entries[i] - min_entries[i])
                else:
                    if weight < 0:
                        total += weight
                    total -= 0.0001  # to differentiate between the lowest value

        i += 1
    return total


def data_table_exists(table):
    """Convenience method for whether a data table exists. Creates the 'tables' table if it doesn't exist."""
    db = get_db()
    if table_exists(TABLE_LIST):
        return db.execute(f'SELECT name FROM {TABLE_LIST} WHERE name=?', (table,)).fetchone() is not None
    else:
        db.execute(CREATE_TABLE_LIST)
        db.commit()
        return False


def table_exists(table):
    """Convenience method for whether a table exists."""
    db = get_db()
    return db.execute('SELECT name FROM sqlite_master WHERE type="table" AND name=?', (table,)).fetchone() is not None


def get_field_names(table):
    """Get the names of fields of a data table"""
    return [field['name'] for field in get_db().execute(f'SELECT name FROM {FIELDS + get_table_id(table)}').fetchall()]


def field_exists(table, field_name):
    """Returns whether a field of a data table exists"""
    return get_db().execute(f'SELECT name FROM {FIELDS + get_table_id(table)} WHERE name=?', (field_name,)) \
        .fetchone() is not None


def get_field_id(table, field_name):
    """Returns the field id (column name in the entries database) from a field name in a data table"""
    db = get_db()
    result = db.execute(f'SELECT * FROM {FIELDS + get_table_id(table)} WHERE name=?', (field_name,)).fetchone()
    if result is None:
        raise Exception(FIELD_DOESNT_EXIST)
    else:
        return FIELD + str(result['id'])


def get_table_id(table):
    """Returns the table id (table name in the database) of a data table"""
    db = get_db()
    result = db.execute(f'SELECT * FROM {TABLE_LIST} WHERE name=?', (table,)).fetchone()
    if result is None:
        raise Exception(TABLE_DOESNT_EXIST)
    else:
        return str(result['id'])


def get_single_result(cursor):
    """Get single results from certain database queries"""
    return list(cursor.fetchone().values())[0]
