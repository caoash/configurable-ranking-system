import "./Header.css"
import Textbox from "./Textbox.js"
import LargeTextbox from "./LargeTextbox.js"
import * as C from './Constants.js'
import axios from "axios"
import {useEffect, useRef, useState} from "react"

const useInterval = (callback, delay) => {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const Header = () => {
    const [status, setStatus] = useState("");
    async function fetchData() {
      await axios.get(C.API + '/status').then(response => {
        if (response.data === "API Online") {
          setStatus("API Online"); 
        } else {
          setStatus("API Offline");
        }
      }).catch(error => {
        console.log(error)
      })
    }
    
    useEffect(() => {
        fetchData();
    });

    useInterval(() => {
        fetchData();
    }, 5000);
    
    console.log(status);
    return (
        <nav className = "bg-dark fixed-top">
            <div className = "container">
                <LargeTextbox text = "Customizable Ranking System" />
                <Textbox text = "Home" to_ref = "/home"/>
                <Textbox text = "About" to_ref = "/about"/>
                <Textbox id="api_status" text = {status}/>
            </div>
        </nav>
    )
}

export default Header;