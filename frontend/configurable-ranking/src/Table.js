import Row from './Row.js'
import "./Table.css"

const Table = (props) => {
    let rows = [];
    let tbhead = [];
    console.log("info 0");
    console.log(props.hinfo[0]);
    for (let i = 0; i < props.hinfo[0].length; i++) {
        tbhead.push(<th>{props.hinfo[0][i]}</th>);
    }
    for (let i = 0; i < props.info.length; i++) {
        let cur = props.info[i];
        rows.push(<Row stats = {cur} />);
    }
    return (
        <table class="table table-bordered">
            <thead>
                {tbhead}
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
    )
}

export default Table;