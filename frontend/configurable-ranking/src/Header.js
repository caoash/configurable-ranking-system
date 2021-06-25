import "./Header.css"
import Textbox from "./Textbox.js"
import LargeTextbox from "./LargeTextbox.js"
import * as C from './Constants.js'
import axios from "axios"


const Header = () => {
    let status = "API Offline";
    axios.get(C.API + '/status').then(response => {
      if (response.data === "API Online") {
        status = "API Online";
        document.getElementById("api_status").text = status;
      }
    }).catch(error => {
      console.log(error)
    })
    return (
        <nav class = "bg-dark fixed-top">
            <div class = "container">
                <LargeTextbox text = "Customizable Ranking System" />
                <Textbox text = "Home" to_ref = "/"/>
                <Textbox text = "About" to_ref = "/about"/>
                <Textbox id="api_status" text = {status}/>
            </div>
        </nav>
    )
}

export default Header;