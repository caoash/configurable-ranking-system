import React from "react"
import Table from "./Table";
import * as C from "./Constants.js";
import {useState, useEffect, useReducer} from "react";
import {useParams} from "react-router-dom";
import {Button, TextField, IconButton} from "@material-ui/core"
import {Pagination} from "@material-ui/lab"
import {Search} from "@material-ui/icons"
import axios from "axios";

const ViewTable = () => {
    const [pageCount, setPageCount] = useState(0);
    const [toggleCheckmarks, setToggleCheckMarks] = useState(true);
    const [filterInput, setFilterInput] = useState("");
    const [nameFieldId, setNameFieldId] = useState(-1);
    const [tbState, setTbState] = useReducer(
         (state, newState) => ({...state, ...newState}),
         {ready: false, filter: {}, fieldSortIndices: [], fieldWeights: [], currentPage: 1}
    );
    const [tableInfo, setTableInfo] = useState({});
    const [entries, setEntries] = useState([]);
    const {tableName} = useParams();

    const setWeight = (i, weight) => {
        let weights = [...tbState.fieldWeights];
        weights[i] = weight;
        setTbState({fieldWeights: weights});
    };

    const handlePagination = (event, value) => {
        setTbState({currentPage: value});
    };

    const handleToggleButton = () => {
        let newWeights = []
        tbState.fieldWeights.forEach((w) => {
            newWeights.push(toggleCheckmarks ? 0 : 1);
        });
        setTbState({fieldWeights: newWeights});
        setToggleCheckMarks(!toggleCheckmarks);
    }

    const handleFilterSearch = () => {
        let filter = {}
        filter[nameFieldId] = {substrings: [filterInput.trim()]};
        setTbState({filter: filter});
    }

    async function fetchTableInfo() {
        await axios.get(`${C.TABLES}/${tableName}/info`).then(async response => {
            let tableInfo = response.data;
            let fields = response.data.fields;
            if (!fields.length) {
                return;
            }
            for (var i = 0; i < fields.length; i++) {
                fields[i] = [fields[i], i];
            }
            fields.sort((field1, field2) => {
                let fieldPrecedence = (field) => {
                    if (field.name.toLowerCase() === "name") {
                        setNameFieldId(field.id);
                        return 2;
                    } else if (!field.isData) {
                        return 1;
                    } else {
                        return 0;
                    }
                };
                let f1 = fieldPrecedence(field1[0]);
                let f2 = fieldPrecedence(field2[0]);
                if (f1 > f2) {
                    return -1;
                } else if (f1 < f2) {
                    return 1;
                } else {
                    return (field1[0].name < field2[0].name ? -1 : (field1[0].name > field2[0].name ? 1 : 0));
                }
            });
            let sortIndices = [];
            for (var j = 0; j < fields.length; j++) {
                sortIndices.push(fields[j][1]);
                fields[j] = fields[j][0];
            }
            tableInfo.fields = fields;
            let weights = [];
            fields.forEach((field) => {
                weights.push(1);
            });
            setTableInfo(tableInfo);
            setTbState({
                ready: true,
                fieldWeights: weights,
                fieldSortIndices: sortIndices
            });
        }).catch(error => {
            console.log(error);
        })
    }

    async function fetchEntries() {
        let query = `${C.TABLES}/${tableName}/entries?` +
            `&fieldWeights=${tbState.fieldWeights.join(",")}` +
            `&page=${tbState.currentPage}`;
        query += ("&filter=" + JSON.stringify(tbState.filter));
        await axios.get(query).then(async response => {
            let data = response.data;
            setEntries(data.entries);
            setPageCount(data.pageCount);
        }).catch(error => {
            console.log(error);
        });
    }

    useEffect(() => {
        if (tbState.ready) {
            fetchEntries();
        }
    }, [tbState])

    useEffect(() => {
        fetchTableInfo();
    }, []);

    // the last div is necessary for some reason
    return (
        <div className="main-body">
            <h1 className="center">{tableInfo.viewName}</h1>
            <div className="hbox">
                <TextField onKeyDown={(e) => {if (e.keyCode === 13) handleFilterSearch()}} onChange={(event) => setFilterInput(event.target.value)} label="Filter"></TextField>
                <IconButton onClick={handleFilterSearch} type="submit"><Search/></IconButton>
                <div className="grow"></div>
                <Button onClick={handleToggleButton} variant="outlined">Toggle All</Button>
            </div>
            <div className="table-container">
                <Table fieldInfo={tableInfo.fields} entries={entries} weights={tbState.fieldWeights} fieldSortIndices={tbState.fieldSortIndices} setWeight={setWeight}/>
            </div>
            <Pagination count={pageCount} onChange={handlePagination} variant="outlined" shape="rounded"/>
            <div style={{padding: "0.05px"}}></div>
        </div>
    )
}

export default ViewTable