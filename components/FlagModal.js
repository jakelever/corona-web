import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default function FlagModal(props) {
	return <Modal show={props.show} onHide={props.closeFunc}>
			<Modal.Header closeButton>
			  <Modal.Title>{props.doc.title}</Modal.Title>
			</Modal.Header>
			<Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
			<Modal.Footer>
			  <Button variant="secondary" onClick={props.closeFunc}>
				Close
			  </Button>
			  <Button variant="primary" onClick={props.closeFunc}>
				Save Changes
			  </Button>
			</Modal.Footer>
		  </Modal>
}