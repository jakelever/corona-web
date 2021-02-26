import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import ReCAPTCHA from "react-google-recaptcha";

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
		this.submitForm = this.submitForm.bind(this);
		
		this.recaptcha = React.createRef();
	}
	
	handleChange(event) {
		this.setState({textvalue: event.target.value});
	}
	
	submitForm (recaptchaToken) {	
		if (recaptchaToken) {	
			const data = {
				doi: this.props.doc.doi,
				issue: this.state.textvalue,
				'cord_uid': this.props.doc.cord_uid,
				'pubmed_id': this.props.doc.pubmed_id,
				recaptcha: recaptchaToken
			}
			
			fetch('/api/flagdoc', {
				method: 'post',
				headers: {
					'Accept': 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			}).then((res) => {
				res.status === 200 ? this.setState({ submit_state: states.SUBMITTED }) : this.setState({ submit_state: states.ERROR })
			})
		} else {
			this.setState({ submit_state: states.ERROR })
		}
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
		
		const hide = {display: 'none'}
		const show = {}
		
		var whichIDToShow = null
		if (this.props.doc.doi)
			whichIDToShow = 'doi'
		else if (this.props.doc.pubmed_id)
			whichIDToShow = 'pubmed_id'
		else if (this.props.doc.cord_uid)
			whichIDToShow = 'cord_uid'
		
		const recaptcha = <ReCAPTCHA
							ref={this.recaptcha}
							size="invisible"
							sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY}
							onChange={ recaptchaToken => this.submitForm(recaptchaToken) }
						  />
		
		return <Modal show={this.props.show} onHide={this.props.closeFunc}>
				<form className="board-form" onSubmit={e => {
						e.preventDefault()
						this.setState({ submit_state: states.SUBMITTING })
						this.recaptcha.current.reset()
						this.recaptcha.current.execute()
					  }}>
		
				<Modal.Header closeButton>
					<Modal.Title>Flag Error with Paper</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Please use this form to notify mistakes with the article type/topics of a paper or extracted entities (e.g. drugs, locations, etc). Your response will be manually reviewed and help to improve this resource.</p>
				
					<div className="form-group row" style={whichIDToShow == 'doi' ? show : hide}>
						<label htmlFor="doi" className="col-sm-2 col-form-label">DOI</label>
						<div className="col-sm-10">
							<input type="text" readOnly className="form-control-plaintext" id="doi" value={this.props.doc.doi} />
						</div>
					</div>
					<div className="form-group row" style={whichIDToShow == 'pubmed_id' ? show : hide}>
						<label htmlFor="pubmed_id" className="col-sm-2 col-form-label">Pubmed ID</label>
						<div className="col-sm-10">
							<input type="text" readOnly className="form-control-plaintext" id="pubmed_id" value={this.props.doc.pubmed_id} />
						</div>
					</div>
					<div className="form-group row" style={whichIDToShow == 'cord_uid' ? show : hide}>
						<label htmlFor="cord_uid" className="col-sm-2 col-form-label">CORD UID</label>
						<div className="col-sm-10">
							<input type="text" readOnly className="form-control-plaintext" id="cord_uid" value={this.props.doc.cord_uid} />
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
					
					{recaptcha}
				
				</Modal.Body>
				<Modal.Footer>
					{submitButton}
				</Modal.Footer>

				</form>
			</Modal>
	}
}