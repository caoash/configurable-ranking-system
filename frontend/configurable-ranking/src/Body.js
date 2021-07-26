import Table from "./Table";
import "./Body.css";
import axios from "axios";
import * as C from "./Constants.js";
import {useState, useEffect, useRef, createRef} from "react";
import {FormControlLabel, Checkbox, Button, Select, InputLabel, MenuItem, FormControl, makeStyles, TextField} from '@material-ui/core'
import {ThemeProvider} from '@material-ui/styles'
import theme from './theme.js'
import Search from './Search.js';

const useStyles = makeStyles(theme => ({
    // Some extra styling if you'd like
    button: {
      margin: theme.spacing(1),
    },
}));

const Body = () => {
    const [headers, setHeaders] = useState(null);
    const [done, setDone] = useState(false);
    const [weights, setWeights] = useState([]);
    const textRef = useRef([]);
    const [curPage, setCurPage] = useState(1);
    const [numPages, setNumpages] = useState(0);
    const [formItems, setFormItems] = useState([]);
    const [checked, setChecked] = useState([]);
    const [nameNum, setNameNum] = useState(-1);
    const [nameSet, setNameSet] = useState(false);
    const classes = useStyles();


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
        await axios.get(C.TABLES + '/college/fields').then(async response => {
            const upd = () => {
                let res = response.data;
                console.log(res);
                for (let i = 0; i < res.length; i++) {
                    console.log(res[i]['name'].toLowerCase() === 'name')
                    if (res[i]['name'].toLowerCase() === 'name') {
                        setNameNum(i + 1);
                        break;
                    }
                }
            };
            upd();
        }).catch(error => {
            console.log(error)
        });
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
        setNameSet(true);
    }, [nameNum]);

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
    
    if (done && nameSet) {
        console.log(curPage);
        console.log(formItems);
        // console.log(headers);
        let filters = {};
        let searchQuery = window.location.href;
        let sep = "";
        let start = false;
        for (let i = 0; i < searchQuery.length; i++) {
            if (searchQuery[i] === '?') {
                start = true;
                continue;
            }
            if (start) sep += searchQuery[i];
        }
        console.log(searchQuery);
        let searchString = sep.substr(2);
        filters[nameNum.toString()] = {"substrings" : [searchString]};
        console.log(JSON.stringify(filters));
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
                <ThemeProvider theme = {theme}>
                    <FormControlLabel
                        control={<Checkbox checked={checked[i]} onChange={handleChange} />}
                        label={x[0]}
                    />
                </ThemeProvider>
            );
        }
        return (
            <div className = "main-body">
                <div className = "move">
                    <div className = "sep">
                        <div className = "horiz-2">
                            <h1 className = "cent"> Weights </h1>
                        </div>
                    </div>
                    <div className = "sep-bot">
                        <div className = "horiz-2">
                            <Search />
                        </div>
                    </div>
                    <div className = "sep-bot">
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
                <Table arr = {weights} filterList = {JSON.stringify(filters)} page = {curPage} resetF = {resetPage}/>
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