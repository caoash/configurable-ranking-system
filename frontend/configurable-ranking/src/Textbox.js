import "./Textbox.css"

const Textbox = (props) => {
    return (
        <a class = "text-format" href = {props.to_ref}>
            {props.text}
        </a>     
    )
}

export default Textbox;