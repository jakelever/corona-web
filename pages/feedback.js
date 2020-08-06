import React, { Component } from 'react';
import Link from 'next/link'

//import Form from 'react-bootstrap/Form'
import { Col, Row, Form, Button } from "react-bootstrap";

import Layout from '../components/Layout.js'

import ReCAPTCHA from "react-google-recaptcha";

const states = {
	ERROR: 1,
	ACTIVE: 2,
	SUBMITTING: 3,
	SUBMITTED: 4
}

export default class FAQs extends Component {
	constructor (props) {
		super(props)
		this.state = {
			textvalue: '',
			selectvalue: 'Suggestion/Idea',
			submit_state: states.ACTIVE
		}
				
		this.handleTextChange = this.handleTextChange.bind(this);
		this.handleSelectChange = this.handleSelectChange.bind(this);
		this.submitForm = this.submitForm.bind(this);
		
		this.recaptcha = React.createRef();
	}
	
	handleSelectChange(event) {
		this.setState({selectvalue: event.target.value});
	}
	
	handleTextChange(event) {
		this.setState({textvalue: event.target.value});
	}
	
	submitForm (recaptchaToken) {	
		if (recaptchaToken) {	
			const data = {
				type: this.state.selectvalue,
				description: this.state.textvalue,
				recaptcha: recaptchaToken
			}
				
			fetch('/api/feedback', {
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
		
		var submitButton
		if (this.state.submit_state == states.SUBMITTED) {
			submitButton = <button type="submit" className="btn btn-primary" disabled>Submitted - Thank You!</button>
		} else if (this.state.submit_state == states.SUBMITTING) {
			submitButton = <button className="btn btn-primary" type="submit" disabled>
						  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
						  &nbsp;&nbsp;Submitting...
						</button>
		} else if (this.state.submit_state == states.ERROR) {
			submitButton = <button type="submit" className="btn btn-warning" disabled>Error: Unable to submit</button>
		}else {
			submitButton = <button type="submit" className="btn btn-primary">Submit</button>
		}
				  
		const recaptcha = <ReCAPTCHA
							ref={this.recaptcha}
							size="invisible"
							sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY}
							onChange={ recaptchaToken => this.submitForm(recaptchaToken) }
						  />
		
		return (
			<Layout title="Feedback" page="/feedback" >
		
				
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">Feedback</h1>
					
				</div>
				
				<div className="card shadow mb-4">
					
					<div className="card-body">
						<p><b>This is an ongoing research project and we therefore welcome feedback as we strive to improve this resource.</b> If you have comments on the topics identified, or some we've missed please put them in below. We can't guarantee that we'll be able make all suggested changes but certainly want to hear about the strengths and weaknesses that users identify. </p>
											
						<hr />
							<Form className="board-form" onSubmit={e => {
							e.preventDefault()
							this.setState({ submit_state: states.SUBMITTING })
							this.recaptcha.current.reset()
							this.recaptcha.current.execute()
						  }}>
								<Form.Group as={Row} controlId="formFeedbackTypeSection">
									<Form.Label column sm={2}>
										Feedback Type:
									</Form.Label>
									<Col sm={10}>
										<Form.Control as="select" size="md" onChange={this.handleSelectChange} disabled={this.state.submit_state!=states.ACTIVE}>
											<option>Suggestion/Idea</option>
											<option>Bug with the website</option>
											<option>Mistake with the topics of the papers</option>
											<option>Missing concept (e.g. drug, vaccine type, etc)</option>
											<option>Missing paper</option>
											<option>Other</option>
										</Form.Control>
									</Col>
								</Form.Group>

								<Form.Group as={Row} controlId="formTextSection">
									<Form.Label column sm={2}>
										Description:
									</Form.Label>
									<Col sm={10}>
										<Form.Group controlId="formText">
											<Form.Control as="textarea" rows="5" required onChange={this.handleTextChange} disabled={this.state.submit_state!=states.ACTIVE} />
										</Form.Group>
									</Col>
								</Form.Group>
								
								{recaptcha}

								<Form.Group as={Row}>
									<Col sm={{ span: 10, offset: 0 }}>
										{submitButton}
									</Col>
								</Form.Group>
							</Form>
								
					</div>
				</div>
				

			</Layout>
		)
	}
}

