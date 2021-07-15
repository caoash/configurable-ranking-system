import Table from "./Table";
import "./Body.css";
import axios from "axios";
import * as C from "./Constants.js";
import {useState, useEffect, useRef, createRef} from "react";
import {TextField, Button, Select, InputLabel, MenuItem, FormControl} from '@material-ui/core'

const Body = () => {
    const [headers, setHeaders] = useState(null);
    const [done, setDone] = useState(false);
    const [weights, setWeights] = useState([]);
    const textRef = useRef([]);
    const [curPage, setCurPage] = useState(1);
    const [numPages, setNumpages] = useState(0);
    const [formItems, setFormItems] = useState([]);

    const updData = async () => {
        let arr = [];
        arr.push(1);
        for (let i = 1; i < headers.length; i++) {
            arr.push(0);
        }
        // console.log("WEIGHTS SET TO: ");
        // console.log(arr);
        setWeights(arr);
        setDone(true);
    };

    const resetPage = () => {
        setCurPage(1);
    };
    
    const fetchData = async () => {
        let head = [];
        await axios.get(C.TABLES + '/college/entries?page=' + curPage).then(async response => {
            const upd = () => {
                let res = response.data;
                let ind = 1;
                head.push(["Name", 0]);
                for (let j in res[0]) {
                    if (j !== "id" && j !== "Name") head.push([j, ind++]);
                }
                return head;
            };
            setHeaders(upd());
        }).catch(error => {
            console.log(error)
        });
        await axios.get(C.TABLES + '/college/page-count').then(async response => {
            setNumpages(response.data);
        }).catch(error => {
            console.log(error);
        });
    };

    const updateWeights = async () => {
        let newWeights = weights.slice();
        for (let i = 0; i < headers.length; i++) {
            let cur = textRef.current[i];
            // console.log(cur);
            let val = await cur.current.value;
            // console.log(val);
            if (isNaN(val)) return;
            newWeights[i] = parseFloat(val);
        }
        setCurPage(1);
        setWeights(newWeights);
    };

    useEffect(() => {
        if (!done) {
            fetchData();
        }
    }, []);

    useEffect(() => {
        if (done) {
            // console.log(numPages);
            let cur = [];
            for (let i = 0; i < numPages; i++) {
                cur.push(<MenuItem value = {i + 1}>{i + 1}</MenuItem>);
            }
            setFormItems(cur);
        }
    }, [numPages])

    useEffect(() => {
        console.log(curPage);
        console.log(done);
    }, [curPage])

    useEffect(() => {
        if (headers !== null) {
            updData();
        }
    }, [headers])
    
    if (done) {
        console.log(curPage);
        console.log(formItems);
        // console.log(headers);
        let cur = [];   
        for (let i = 0; i < headers.length; i++) textRef.current[i] = createRef();
        for (let i = 0; i < headers.length; i++) {
            let x = headers[i];
            cur.push(<TextField key={x[1]} id={x[1].toString()} label={x[0]} variant="outlined" inputRef = {textRef.current[i]} className = "field"/>);
        }
        return (
            <div className = "main-body">
                <div className = "move">
                    <h1 className = "cent"> Weights </h1>
                    <div className = "sep">
                        <div className = "horiz">
                            {cur}
                            <Button className = "btn" variant = "outlined" onClick = {() => updateWeights()}> Sort </Button>
                        </div>
                        <FormControl className = "form">
                            <InputLabel>Page</InputLabel>
                            <Select onChange = {(e) => {setCurPage(e.target.value)}} value = {curPage}>
                                {formItems}
                            </Select> 
                        </FormControl>
                    </div>
                </div>
                <Table arr = {weights} page = {curPage} resetF = {resetPage}/>
            </div>
            
        )
    } else {
        return (
            <div className = "main-body">
                <div className = "move">
                    <h1>Loading...</h1> 
                </div>
            </div>     
        )
    }
}

export default Body;