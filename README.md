# configurable-ranking-system
This project allows user to import databases and sort data according to chosen criteria. It includes a React frontend that interacts with a Flask API.

### Contents
* [API endpoints](#API-endpoints)

### API endpoints
Note: Assume calls return JSON. 'table' refers to a user made table's id. [See](https://flask.palletsprojects.com/en/2.0.x/api/#url-route-registrations) 
url routing in Flask.
* GET [/table/\<string:table>/\<int:entry_id>]()
    * Fetch an entry from a data table by its id
* GET [/table/\<string:table>/entries]()
    * Retrieve entries from a data table ranked according to data fields.  
        Returns a dict:  
        * entries - list of entries  
        * total - number of entries (according to filter)  
        * pageCount - number of pages (according to filter) 
        
        Notes:  
        * Ranking entries happens by normalizing all data fields to be between 0 and 1 and then adding the fields together. Fields have a default sorting direction (by multiplying the weight by -1). Empty fields (None) are penalized as the minimum value).  
        
        Query parameters:
        * Include 'fieldWeights' to weight the different field ids. fieldWeights should include weights for all fields, even those with isData false. Weights are in order of the field ids. 
        * Include 'page' for pagination. A page has PAGE_SIZE entries. Pages start at 1. 
        * Include 'filter' to filter the entries. filter is a json object: each property (optional) is a field id and its associated filter. If the field isData then a min and max property can be specified as the filter. If not isData then a list of substrings can be specified where an entry is included if the field matches any of the substrings included.
* GET [/table/\<string:table>/info]()
    * Returns the table info of a data table. This includes all properties of the actual table info, including a list of fields, and an entry count. Look at the create_table method for details on actual table info.
* GET [/tables]()
    * Get a list of all data tables. 
* GET [/table/\<string:table>/exists]()
    * Returns whether a table name matches any data table.
* POST [/table/\<string:table>/add-entries]()
    * Add an entry to a data table. Requires a header 'entryFields' that stores a json dict of field names, and their associated value.
* POST [/table/create]()
    * Create a data table  
        Request headers:
        * Requires 'tableName' which must be unique
        * Optional 'viewName' will be shown to users, not unique
        * Optional 'tableDescription' description for table
* POST [/table/\<string:table>/add-field]()
    * Add a field to a data table  
        Request headers:
        * Required 'fieldName' name of the field (must be unique within the data table)
        * Optional 'fieldDescription' description of the field
        * Required 'isData' specifies whether the field is just entry info or is a number meant to be used as criteria. Pass in 'true' to set isData to 'true' (no quotations). isData true means that the field expects numbers while false stores the field as a string.
        * Required 'fieldIsAscending' specifies the default sort direction of the field. 'true' means that small values are more favorable.
* PUT [/table/\<string:table>/\<int:entry_id>/edit]()
    * Edit an entry in a data table according to its id. Requires a header 'entryFields' that stores a json dict of field names, and their associated value.
* PUT [/table/\<string:table>/edit]()
    * Update a data table's info  
        Request headers:
        * Optional 'newDescription' see create_table for usage
        * Optional 'newViewName' see create_table for usage
* PUT [/table/\<string:table>/\<string:field>/edit]()
    * Edit an existing field of a data table  
        Request headers (all optional see equivalent post method for descriptions):
        * 'newFieldName' analogous to 'fieldName'
        * 'newFieldDescription' analogous to 'fieldDescription'
        * 'newFieldIsAscending' analogous to 'fieldIsAscending'
* DELETE [/table/\<string:table>/\<int:entry_id>/delete]()
    * Delete an entry from a data table by its id.
* DELETE [/table/\<string:table>/delete]()
    * Delete a table.
* DELETE [/table/\<string:table>/\<string:field>/delete]()
    * Delete a field of a data table.