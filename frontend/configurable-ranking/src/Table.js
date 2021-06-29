import Row from './Row.js'
import "./Table.css"
import {useState, useEffect} from "react";
import axios from "axios"
import * as C from './Constants.js'

const Table = () => {
    const [sortBy, setSortBy] = useState('admissionRate');
    const [fin, setFin] = useState(false);
    const [res, setRes] = useState(null);
    const [init, setInit] = useState(false);
    const [nr, setNr] = useState(-1);
    const [nc, setNc] = useState(-1);
    let objs = [];
    let head = [];
    // console.log(sortBy);
    // console.log(fin);
    useEffect(() => {
        if (!fin) {
            fetchData();
        }
    });
    async function fetchData() {
        console.log("QUERYING: " + C.API + '/college/sorted?' + sortBy);
        await axios.get(C.API + '/college/sorted?' + sortBy).then(async response => {
            // console.log(response);
            await setRes(response.data);
            await setFin(true);
            await setInit(true);
        }).catch(error => {
            console.log(error)
        })
    }
    if (init) { 
        let params = [];
        for (let k in res[0]) {
            params.push(k);
        }
        console.log(params);
        head.push(params);
        for (let i = 0; i < res.length; i++) {
            let cur = [];
            for (let j in res[i]) {
                cur.push(res[i][j]);
            }
            objs.push(cur);
        }
        let hinfo = head;
        let info = objs;
        let tbhead = [];
        if (nr === -1 && nc === -1) {
            setNr(info.length + 1);
            setNc(hinfo[0].length);
        }
        for (let i = 0; i < hinfo[0].length; i++) {
            tbhead.push(<th> <button onClick = {() => {
                setSortBy(hinfo[0][i]);
                setFin(false);
            }}> {hinfo[0][i]} </button></th>);
        }
        let rows = [];
        for (let i = 0; i < info.length; i++) {
            let cur = info[i];
            rows.push(<Row stats = {cur} />);
        }
        return (
            <table className = "table table-bordered">
                <thead>
                    <tr>
                        {tbhead}
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        ); 
    } else {
        return (
            <>
            </>
        );
    }
}

export default Table;