import React, { Component } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Search from '../components/Search.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'

/* Topbar */
export default class Topbar extends Component {
	constructor(props) {
		super(props) //since we are extending className Table so we have to use super in order to override Component className constructor
		this.state = { 
			menuOpen: false,
			viruses: []
		}
		
		this.dropdownToggle = this.dropdownToggle.bind(this);
		this.menuItemClickedThatShouldntCloseDropdown = this.menuItemClickedThatShouldntCloseDropdown.bind(this);
		
		this.toggleVirus = this.toggleVirus.bind(this);
	}
	
	toggleVirus(virus,isSelected) {
		var updated_viruses = this.state.viruses.filter(v => (v!=virus))
		
		if (isSelected == true) {
			updated_viruses.push(virus)
		}
		
		updated_viruses = updated_viruses.sort()
		
		this.setState({viruses: updated_viruses})
		
		if (this.props.updateViruses) {
			if (updated_viruses.length == 0) {
				this.props.updateViruses(['MERS-CoV','SARS-CoV','SARS-CoV-2'])
			} else {
				this.props.updateViruses(updated_viruses)
			}
		}
	}
	
	dropdownToggle(newValue){
		if (this._forceOpen){
			this.setState({ menuOpen: true });
			this._forceOpen = false;
		} else {
			this.setState({ menuOpen: newValue });
		}
	}
	
	menuItemClickedThatShouldntCloseDropdown(){
		this._forceOpen = true;
	}
	
	render() {
		// 
		var virusButtonText = 'Select virus of interest'
		/*if (this.state.viruses.length == 0 || this.state.viruses == ['MERS-CoV','SARS-CoV','SARS-CoV-2']) {
			virusButtonText = 'Showing SARS-CoV-2, MERS-CoV & SARS-CoV'
		}*/
		
		const virusSelector = this.props.showVirusSelector ? <Dropdown show={this.state.menuOpen} onToggle={val => this.dropdownToggle(val)}>
			<Dropdown.Toggle variant="secondary" id="dropdown-basic">
				{virusButtonText}
			</Dropdown.Toggle>

			<Dropdown.Menu>
				<Dropdown.Item href="#/" onClick={() => this.menuItemClickedThatShouldntCloseDropdown()}>
					<Form.Check type="checkbox" id="default-checkbox1" label="SARS-CoV-2" onChange={event => this.toggleVirus('SARS-CoV-2',event.target.checked)} />
				</Dropdown.Item>
				<Dropdown.Item href="#/" onClick={() => this.menuItemClickedThatShouldntCloseDropdown()}>
					<Form.Check type="checkbox" id="default-checkbox2" label="MERS-CoV" onChange={event => this.toggleVirus('MERS-CoV',event.target.checked)} />
				</Dropdown.Item>
				<Dropdown.Item href="#/" onClick={() => this.menuItemClickedThatShouldntCloseDropdown()}>
					<Form.Check type="checkbox" id="default-checkbox3" label="SARS-CoV" onChange={event => this.toggleVirus('SARS-CoV',event.target.checked)} />
				</Dropdown.Item>
			</Dropdown.Menu>
		</Dropdown> : ''
		
		return (
	<nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
	
		{/* Sidebar Toggle (Topbar) */}
		<button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3 text-secondary" onClick={event => this.props.toggleSidebar()}>
			<FontAwesomeIcon icon={faBars}  />
		</button>

		<Search />

		{virusSelector}

		{/* End of Topbar */}
	</nav>
	)
	}
}
