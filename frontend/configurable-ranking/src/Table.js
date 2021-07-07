import Row from './Row.js'
import "./Table.css"
import {useState, useEffect} from "react";
import axios from "axios"
import * as C from './Constants.js'

const Table = (props) => {
    const [sortWeights, setSortWeights] = useState([]);
    const [fin, setFin] = useState(true);
    const [res, setRes] = useState(null);
    const [init, setInit] = useState(false);
    const [done, setDone] = useState(false);
    const [nr, setNr] = useState(-1);
    const [nc, setNc] = useState(-1);
    const [np, setNp] = useState(-1);
    const [gParams, setgParams] = useState(null);

    // console.log(sortBy);
    // console.log(fin);
    useEffect(() => {
        setSortWeights(props.arr)
    }, [props.arr]);

    useEffect(() => {
        if (!done) fetchData();
    }, []);
    useEffect(() => {
        if (sortWeights === null || gParams === null) return;
        const fetchSortedData = (async () => {
            let qryString = C.API + '/college/entries?sort='
            for (let i = 0; i < gParams.length; i++) {
                qryString += gParams[i];
                if (i !== gParams.length - 1) qryString += ",";
            }   
            qryString += "&columnWeights=";
            for (let i = 0; i < sortWeights.length; i++) {
                qryString += sortWeights[i];
                if (i !== sortWeights.length - 1) qryString += ",";
            }
            qryString += ("&page=" + props.page);
            await axios.get(qryString).then(async response => {
                let get = response.data;
                await setRes(get);
                await setFin(true);
                await setDone(true);
            }).catch(error => {
                console.log(error);
            })
        })
        fetchSortedData();
    }, [sortWeights, props.page]);
    async function fetchData() {
        console.log(C.API + '/college/entries?page='+ props.page);
        await axios.get(C.API + '/college/entries?page='+props.page).then(async response => {
            let get = response.data;
            // console.log(get);
            setNp(Object.keys(get[0]).length - 1);
            let params = [];
            params.push("Name");
            for (let j in get[0]) {
                if (j !== "id" && j !== "Name") params.push(j);
            }
            if (gParams === null) await setgParams(params);
            setSortWeights(props.arr);
            setRes(get);
            setInit(true);
            setFin(false);
        }).catch(error => {
            console.log(error);
        })
    }
    
    if (init) { 
        // console.log("RES = ");
        // console.log(res);
        let objs = [];
        for (let i = 0; i < res.length; i++) {
            let cur = [];
            cur.push(res[i]["Name"]);
            for (let j in res[i]) {       
                if (j !== "id" && j !== "Name") {
                    cur.push(res[i][j]);
                }
            }
            objs.push(cur);
        }
        let hinfo = gParams;
        let tbhead = [];
        if (nr === -1 && nc === -1) {
            setNr(objs.length + 1);
            setNc(hinfo.length);
        }
        // console.log(hinfo);
        for (let i = 0; i < hinfo.length; i++) {
            tbhead.push(<th key = {i}> <button onClick = {() => {
                let wgts = [];
                for (let j = 0; j < np; j++) {
                    if (i === j) wgts.push(1);
                    else wgts.push(0);
                }
                setSortWeights(wgts);
                setFin(false);
                props.resetF();
            }} key = {i}> {hinfo[i]} </button></th>);
        }
        let rows = [];
        for (let i = 0; i < objs.length; i++) {
            let cur = objs[i];
            rows.push(<Row stats = {cur} key = {i}/>);
        }
        // console.log(tbhead);
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