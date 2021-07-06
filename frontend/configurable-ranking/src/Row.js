import "./Row.css"

const Row = (props) => {
    let cur = [];
    // console.log("stats:" + props.stats);
    cur.push(<th className = "bold-text" key = {-1}>{props.stats[0]}</th>)
    for (let i = 1; i < props.stats.length; i++) {
        let item = props.stats[i];
        cur.push(<th className = "normal-text" key = {i}>{item}</th>)
    }
    // console.log("CUR");
    // console.log(cur);
    return (
        <tr>
            {cur}
        </tr>
    )
}

export default Row;