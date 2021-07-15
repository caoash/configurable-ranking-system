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
    return (
        <nav className="bg-dark fixed-top">
            <div className="container">
                <LargeTextbox text="Customizable Ranking System" />
                <Textbox text="Home" to_ref="/home"/>
                <Textbox text="Import" to_ref="/import"/>
                <Textbox text="About" to_ref="/about"/>
            </div>
        </nav>
    )
}

export default Header;