import {Modal, Backdrop, Fade} from '@material-ui/core';

const TableInfoModal = (props) => {
    let fieldInfo = "fields:";
    for (let i in props.table.fields) {
        let field = props.table.fields[i];
        let fieldType = "";
        if (field.isData === 1) {
            fieldType += "\n\tdata";
            if (field.isAscending === 1) {
                fieldType += " ascending";
            } else {
                fieldType += " descending";
            }
        }
        fieldInfo += `\n\n\tname: ${field.name}\n\tdescription: ${field.description}\n\tid: ${field.id}${fieldType}`;
    }

    return (
        <Modal open={props.open} onClose={props.closeModal}
                closeAfterTransition BackdropComponent={Backdrop}
                BackdropProps={{timeout: 500}}
                className={props.classes.modal}>
            <Fade in={props.open}>
                <div className="modal-paper">
                    <p>{"viewName: " + props.table.viewName}</p>
                    <p>{"id: " + props.table.name}</p>
                    <p>{"description: " + props.table.description}</p>
                    <p>{"size: " + props.table.entryCount}</p>
                    <p style={{whiteSpace: "pre-wrap"}}>{fieldInfo}</p>
                </div>
            </Fade>
        </Modal>
  );
}

export default TableInfoModal;