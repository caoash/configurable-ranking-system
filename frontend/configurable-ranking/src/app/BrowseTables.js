import {useState, useEffect} from "react";
import {Divider} from "@material-ui/core"
import axios from "axios";
import TableInfoModal from "./TableInfoModal.js";
import * as UI from "./ComponentStyles.js";
import * as C from "./Constants.js";

const BrowseTables = () => {
    const [tables, setTables] = useState([]);
    const [modalStates, setModalStates] = useState([]);
    const classes = UI.classes();

    async function fetchTables() {
        await axios.get(C.API + "/tables").then(async response => {
            setTables(response.data);
            let openStates = [];
            for (let i = 0; i < response.data.length; i++) {
                openStates.push(false);
            }
            setModalStates(openStates);
        }).catch(error => {
            console.log(error);
        });
    }

    const openModal = (i) => {
        let openStates = [...modalStates];
        openStates[i] = true;
        setModalStates(openStates);
    }

    const closeModal = (i) => {
        let openStates = [...modalStates];
        openStates[i] = false;
        setModalStates(openStates);
    }

    useEffect(() => {
        fetchTables();
    }, []);

    let tableList = [];
    if (modalStates.length > 0) {
        for (let i in tables) {
            let table = tables[i];
            tableList.push(<div key={i}>
                <a className="link no-margin" href={"/view/" + table.name}><p className="no-margin">{table.viewName}</p></a>
                <p className="no-margin">{table.description}</p>
                <TableInfoModal open={modalStates[i]} table={table} closeModal={() => closeModal(i)} classes={classes}></TableInfoModal>
                <p className="link no-margin" onClick={() => openModal(i)}>More details</p>
                <Divider variant="middle"/>
            </div>);
        }
    }

    return (
        <div className="main-body">
            <h1 className="center">Tables</h1>
            {tableList}
        </div>
    );
}

export default BrowseTables;