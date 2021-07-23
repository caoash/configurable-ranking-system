import Table from "./Table";
import "./Body.css";
import axios from "axios";
import * as C from "./Constants.js";
import {useState, useEffect, useRef, createRef} from "react";
import {FormControlLabel, Checkbox, Button, Select, InputLabel, MenuItem, FormControl} from '@material-ui/core'

const Body = () => {
    const [headers, setHeaders] = useState(null);
    const [done, setDone] = useState(false);
    const [weights, setWeights] = useState([]);
    const textRef = useRef([]);
    const [curPage, setCurPage] = useState(1);
    const [numPages, setNumpages] = useState(0);
    const [formItems, setFormItems] = useState([]);
    const [checked, setChecked] = useState([]);


    const updData = async () => {
        let arr = [];
        for (let i = 0; i < headers.length; i++) {
            arr.push(1);
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
                // head.push(["Name", 0]);
                for (let j in res[0]) {
                    console.log(isNaN(res[0][j]));
                    if (isNaN(res[0][j])) continue;
                    if (j !== "id" && j !== "Name") head.push([j, ind++]);
                }
                console.log(head);
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
            let cur = checked[i];
            newWeights[i] = (cur ? 1 : 0);
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
            const handleChange = (event) => {
                let temp = checked.slice();
                temp[i] = event.target.checked;
                setChecked(temp);
            };
            let x = headers[i];
            cur.push(
                <FormControlLabel
                    control={<Checkbox checked={checked[i]} onChange={handleChange} />}
                    label={x[0]}
                />
            );
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