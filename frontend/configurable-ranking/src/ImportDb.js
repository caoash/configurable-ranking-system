import React, {Component} from "react"
import {Button} from "@material-ui/core";
import Textbox from "./Textbox.js"
import "./Body.css";
import "./ImportDb.css";

class ImportDb extends Component {
    textarea = React.createRef();

    onKeyDown = (e) => {  // so tabs work
        var CODE = 9;
        var TAB = "    ";
        if(e.keyCode == CODE) {
            var area = this.textarea.current
            var startPos = area.selectionStart;
            var endPos = area.selectionEnd;
            area.value = area.value.substring(0, startPos)
                            + TAB
                            + area.value.substring(endPos, area.value.length);
            area.selectionStart = startPos + TAB.length;
            area.selectionEnd = startPos + TAB.length;
            e.preventDefault();
            return false;
        }
    }

    import = () => {
        console.log("Importing database")
    }

    render() {
        return (
            <div className="main-body">
                <div className="move">
                    <div className="sep">
                        <h1>JSON Config</h1>
                        <a class="link" href="/example_import.json" target="_blank"><p>Example</p></a>
                    </div>
                    <textarea ref={this.textarea} className="large-textarea" onKeyDown={this.onKeyDown}></textarea>
                    <Button variant="outlined" onClick={this.import}>Import</Button>
                </div>
            </div>
        );
    }
}

export default ImportDb;