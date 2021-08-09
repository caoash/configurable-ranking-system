import * as C from "./Constants.js";
import {useState, useEffect} from "react";
import {Divider, IconButton, Box} from "@material-ui/core"
import axios from "axios";

const BrowseTables = () => {
    const [tables, setTables] = useState([]);

    async function fetchTables() {
        await axios.get(C.API + "/tables").then(async response => {
            setTables(response.data);
        }).catch(error => {
            console.log(error);
        });
    }

    useEffect(() => {
        fetchTables();
    }, []);

    let tableList = [];
    for (let i in tables) {
        let table = tables[i];
        tableList.push(<>
            <a className="link no-margin" href={"/view/" + table.name}><p className="no-margin">{table.viewName}</p></a>
            <p className="no-margin">{table.description}</p>
            <Divider variant="middle"/>
        </>);
    }

    return (
        <div className="main-body">
            <h1 className="center">Tables</h1>
            {tableList}
        </div>
    );
}

export default BrowseTables;