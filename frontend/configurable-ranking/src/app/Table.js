import "../resources/App.css"
import {Checkbox} from "@material-ui/core"

const Table = (props) => {
    const handleChecked = (event, index) => {
        props.setWeight(index, event.target.checked ? 1 : 0);
    }

    const handleFlipped = (event, index) => {
        props.setWeight(index, props.weights[index] * -1);
    }

    let tableHead = [];
    for (let i in props.fieldInfo) {
        let field = props.fieldInfo[i];
        let weightIndex = props.fieldSortIndices[i];
        let weight = props.weights[weightIndex];
        let arrow = "▲";
        if (!weight) {
            arrow = "";
        } else if (field.isAscending ^ (weight > 0)) {
            arrow = "▼";
        }
        let width = field.isData ? "100px" : "200px";
        tableHead.push(<th key={i}>
            <div className="inline-row">
                <div className="header-text" style={{"width": width}}><span>{field.name}</span></div>
                {field.isData === 1 && <>
                    <div onClick={(e) => handleFlipped(e, weightIndex)}><p>{arrow}</p></div>
                    <Checkbox onChange={(e) => handleChecked(e, weightIndex)} checked={weight !== 0} color="default"></Checkbox>
                </>}
            </div>
        </th>);
    }
    let tableRows = [];
    for (let i in props.entries) {
        let cells = [];
        for (let key in props.fieldInfo) {
            let width = props.fieldInfo[key].isData ? "100px" : "200px";
            cells.push(
            <td key={key} className="normal-text">
                <div className="table-text" style={{"width": width}}><span>{props.entries[i][props.fieldInfo[key].name]}</span></div>
            </td>);
        }
        tableRows.push(<tr key={i}>{cells}</tr>);
    }
    return (
        <table className="table table-bordered">
            <thead className="fixed-head">
                <tr>
                    {tableHead}
                </tr>
            </thead>
            <tbody>
                {tableRows}
            </tbody>
        </table>
    );
}

export default Table;