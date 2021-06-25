import "./Header.css"
import Textbox from "./Textbox.js"
import LargeTextbox from "./LargeTextbox.js"


const Header = () => {
    return (
        <nav class = "bg-dark fixed-top">
            <div class = "container">
                <LargeTextbox text = "Customizable Ranking System" />
                <Textbox text = "Home" to_ref = "/"/>
                <Textbox text = "About" to_ref = "/about"/>
            </div>
        </nav>
    )
}

export default Header;