import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const states = {
	ERROR: 1,
	ACTIVE: 2,
	SUBMITTING: 3,
	SUBMITTED: 4
}

export default class FlagModal extends Component {
	constructor (props) {
		super(props)
		this.state = {
			textvalue: '',
			submit_state: states.ACTIVE
		}
		
		this.handleChange = this.handleChange.bind(this);
	}
	
	handleChange(event) {
		this.setState({textvalue: event.target.value});
	}
	
	submitForm () {
		const data = {
			doi: this.props.doc.doi,
			issue: this.state.textvalue,
			'cord_uid': this.props.doc.cord_uid,
			'pubmed_id': this.props.doc.pubmed_id
		}
		
		this.setState({ submit_state: states.SUBMITTING })
		fetch('/api/flagdoc', {
			method: 'post',
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}).then((res) => {
			res.status === 200 ? this.setState({ submit_state: states.SUBMITTED }) : ''
		})
	}

	render() {
		if (!this.props.show)
			return <div></div>
		
		var submitButton
		if (this.state.submit_state == states.SUBMITTED) {
			submitButton = <button type="submit" className="btn btn-primary" disabled>Submitted - Thank You!</button>
		} else if (this.state.submit_state == states.SUBMITTING) {
			submitButton = <button className="btn btn-primary" type="submit" disabled>
						  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
						  Submitting...
						</button>
		} else if (this.state.submit_state == states.ERROR) {
			submitButton = <button type="submit" className="btn btn-danger" disabled>ERROR</button>
		}else {
			submitButton = <button type="submit" className="btn btn-primary">Submit</button>
		}
		
		return <Modal show={this.props.show} onHide={this.props.closeFunc}>
				<form className="board-form" onSubmit={e => {
						e.preventDefault()
						this.submitForm()
					  }}>
		
				<Modal.Header closeButton>
					<Modal.Title>Flag Error with Paper</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Please use this form to notify mistakes with the topic of a paper, or extracted entities (e.g. drugs, locations, etc). Your response will be manually reviewed and help to improve this resource.</p>
				
					<div className="form-group row">
						<label htmlFor="doi" className="col-sm-2 col-form-label">DOI</label>
						<div className="col-sm-10">
							<input type="text" readOnly className="form-control-plaintext" id="doi" value={this.props.doc.doi} />
						</div>
					</div>
					<div className="form-group row">
						<label htmlFor="title" className="col-sm-2 col-form-label">Title</label>
						<div className="col-sm-10">
							<input type="text" readOnly className="form-control-plaintext" id="title" value={this.props.doc.title} />
						</div>
					</div>
					<div className="form-group row">
						<label htmlFor="issue" className="col-sm-2 col-form-label">Issue</label>
						<div className="col-sm-10">
							<textarea className="form-control" id="issue" rows="3" required value={this.state.textvalue} onChange={this.handleChange}  disabled={this.state.submit_state!=states.ACTIVE} />
						</div>
					</div>
				
				</Modal.Body>
				<Modal.Footer>
					{submitButton}
				</Modal.Footer>

				</form>
			</Modal>
	}
}