import React, { Component } from "react"
import { Button } from "@material-ui/core";
import axios from "axios";
import { readString } from 'react-papaparse'
import Textbox from "./Textbox.js"
import "./Body.css";
import "./ImportDb.css";
import * as API from "./Constants.js"

class ImportDb extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: "End",
            statusColor: this.StatusColors.STATUS
        }
    }

    textarea = React.createRef();
    fileInput = React.createRef();
    statusText = React.createRef();

    componentDidMount() {
        this.statusText.current.innerHTML = "Enter your import config below (<a class='link' href='/example_import.json' target='_blank'>example</a>): ";
        console.log("hi");
    }

    DataType = {
        CSV: 0
    }

    StatusColors = {
        STATUS: "000000",
        ERROR: "fc1303",
        SUCCESS: "1ca62a"
    }

    parseBool = (str) => {
        return str.toLowerCase() === "true";
    }

    onKeyDown = (e) => {  // so tabs work
        var CODE = 9;
        var TAB = "    ";
        if(e.keyCode == CODE) {
            var area = this.textarea.current
            var startPos = area.selectionStart;
            var endPos = area.selectionEnd;
            area.value = area.value.substring(0, startPos)
                            + TAB
                            + area.value.substring(endPos, area.value.length);
            area.selectionStart = startPos + TAB.length;
            area.selectionEnd = startPos + TAB.length;
            e.preventDefault();
            return false;
        }
    }

    error(msg) {
        this.setState({
            status: msg,
            statusColor: this.StatusColors.ERROR
        });
        throw msg;
    }

    status(msg) {
        this.setState({
            status: msg,
            statusColor: this.StatusColors.STATUS
        });
    }

    success(msg) {
        this.setState({
            status: msg,
            statusColor: this.StatusColors.SUCCESS
        });
    }

    importData = (data, type, config) => {
        var check = config;
        var checkMissing = (prop, err) => {
            if (!check.hasOwnProperty(prop)) {
                this.error(err);
            }
        };
        var addEntries = (fields) => {
            var entries = [];
            data.forEach((e) => {
                var entry = {};
                fields.forEach((field) => {
                    entry[field.name] = e[field.sourceColumn];
                });
                entries.push(entry);
            });
            var add = () => {
                if (entries.length) {
                    axios.post(API.TABLES + `/${config.name}/add-entries`, {}, {headers: {
                        entryFields: JSON.stringify(entries.splice(0, 25))
                    }}).then((response) => {
                        this.status(`${entries.length} left to be added`);
                        add();
                    });
                } else {
                    this.success("Import successful");
                }
            }
            add();
        };
        var createFields = () => {
            checkMissing("fields", "Expected config root property 'fields'");
            var headerList = [];
            var fieldList = [];
            config.fields.forEach((field) => {
                check = field;
                checkMissing("name", "Expected field property 'name'");
                checkMissing("sourceColumn", "Expected field property 'sourceColumn'");
                checkMissing("isData", "Expected field property 'isData'");
                if (field.isData) {
                    checkMissing("sortDirection", "Expected field property 'sortDirection'");
                }
                if (!(field.sourceColumn in data[0])) {
                    this.error(`Source column '${field.sourceColumn}' not found`);
                }
                var headers = {
                    fieldName: field.name,
                    fieldDescription: field.description || "",
                    fieldIsData: field.isData,
                    fieldIsAscending: field.sortDirection === "ascending" ? "true" : "false"
                };
                headerList.push(headers);
                fieldList.push(field)
            });
            headerList.reverse();
            var addField = () => {
                if (headerList.length) {
                    axios.post(API.TABLES + `/${config.name}/add-field`, {}, {
                        headers: headerList.pop()
                    }).then((response) => {
                        addField();
                    });
                } else {
                    if (!config.hasOwnProperty("importEntries") || config.importEntries) {
                        this.success("Database instantiated");
                        addEntries(fieldList);
                    }
                }
            };
            addField();
        };
        var createTable = () => {
            checkMissing("name", "Expected config root property 'name'");
            axios.post(API.TABLES + "/create", {}, {headers: {
                tableName: config.name,
                viewName: config.viewName || config.name,
                tableDescription: config.description || ""
            }}).then((response) => {
                createFields();
            });
        };
        createTable();
    }

    importLocal = (e) => {
        var file = this.fileInput.current.files[0];
        if (!file) {
            this.error("Select a file");
        }
        var config = JSON.parse(this.textarea.current.value);
        var next = () => {
            var reader = new FileReader();
            this.status("Loading file (browser might freeze for a second)");
            if (file.name.split(".").pop() === "csv") {
                reader.readAsText(file, "UTF-8");
                reader.onload = (evt) => {
                    this.importData(readString(evt.target.result, {header: true}).data, this.DataType.CSV, config);
                }
                reader.onerror = (evt) => {
                    this.error("Error reading file");
                }
            } else {
                this.error("Please select a csv file");
            }
        };
        axios.get(API.TABLES + `/${config.name}/exists`).then((response) => {
            if (this.parseBool(response.data)) {
                if (config.overwrite) {
                    axios.delete(API.TABLES + `/${config.name}/delete`);
                    next()
                } else {
                    this.error("Table already exists");
                }
            } else {
                next()
            }
        });
    }

    render() {
        require('react-dom');
        window.React2 = require('react');
        console.log(window.React1 === window.React2);
        return (
            <div className="main-body">
                <div className="move_box">
                    <div className="sep">
                        <h1>Import Database</h1>
                    </div>
                    <p ref={this.statusText} style={{color: "#" + this.state.statusColor}}>{this.state.status}</p>
                    <textarea ref={this.textarea} className="large-textarea" onKeyDown={this.onKeyDown}></textarea>
                    <Button variant="outlined" onClick={() => this.fileInput.current.click()}>Import Data</Button>
                    <input ref={this.fileInput} onChange={this.importLocal} type="file" className="hidden"/>
                </div>
            </div>
        );
    }
}

export default ImportDb;