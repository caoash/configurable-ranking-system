import "./LargeTextbox.css"

const LargeTextbox = (props) => {
    return (
        <p className = "large-text-format">
            {props.text}
        </p>     
    )
}

export default LargeTextbox;