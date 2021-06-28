import './App.css';
import Header from "./Header.js"
import Controls from "./Controls.js"
import Table from "./Table.js"
import {useEffect, useState} from 'react';
import {BrowserRouter, Route, Redirect} from 'react-router-dom'
import axios from "axios"
import * as C from './Constants.js'

const App = () => {
  const [fin, setFin] = useState(false);
  const [res, setRes] = useState(null);
  let objs = [];
  let head = [];
  
  useEffect(() => {
    if (!fin) {
      fetchData();
    }
  });

  async function fetchData() {
    await axios.get(C.API + '/college/sorted?admissionRate').then(async response => {
      console.log(response);
      await setRes(response.data);
      await setFin(true);
    }).catch(error => {
      console.log(error)
    })
  }
  if (fin) {
    let params = [];
    console.log(res[0]);
    for (let k in res[0]) {
      console.log("key: " + k);
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
    return (
      <BrowserRouter>
        <Route exact path = "/">
          <Redirect to="/home"/>
        </Route>
        <Route path = "/home">
          <div className = "main-container">
            <Header />
            <div className = "main-body">
              <Controls />
              <Table hinfo = {head} info = {objs}/>
            </div>
          </div>
        </Route>
        <Route path = "/about">
          <div className = "main-container">
            <Header />
          </div>
        </Route>
      </BrowserRouter>
      
    )
  } else {
    return (
      <>
      </>
    )
  }
}

export default App;
