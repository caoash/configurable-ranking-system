import "./Textbox.css"

const Textbox = (props) => {
    return (
        <a class = "text-format" id = {props.id} href = {props.to_ref}>
            {props.text}
        </a>     
    )
}

export default Textbox;