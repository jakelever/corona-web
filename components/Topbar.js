import React, { Component } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Search from '../components/Search.js'

/* Topbar */
class Topbar extends Component {
	constructor(props) {
		super(props) //since we are extending className Table so we have to use super in order to override Component className constructor
		this.state = { 
			menuOpen: false
		}
		
		this.dropdownToggle = this.dropdownToggle.bind(this);
		this.menuItemClickedThatShouldntCloseDropdown = this.menuItemClickedThatShouldntCloseDropdown.bind(this);
		
		this.updateVirus = this.updateVirus.bind(this);
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
	
	updateVirus(virus,isSelected) {
		if (this.props.updateVirus) {
			this.props.updateVirus(virus,isSelected)
		}
	}
	
	render() {
		return (
	<nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">

		{/* Sidebar Toggle (Topbar) */}
		<button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3">
			<i className="fa fa-bars"></i>
		</button>

		<Search />

		<Dropdown show={this.state.menuOpen} onToggle={val => this.dropdownToggle(val)}>
			<Dropdown.Toggle variant="secondary" id="dropdown-basic">
				Select virus of interest
			</Dropdown.Toggle>

			<Dropdown.Menu>
				<Dropdown.Item href="#/" onClick={() => this.menuItemClickedThatShouldntCloseDropdown()}>
					<Form.Check type="checkbox" id="default-checkbox1" label="SARS-CoV-2" onChange={event => this.updateVirus('SARS-CoV-2',event.target.checked)} />
				</Dropdown.Item>
				<Dropdown.Item href="#/" onClick={() => this.menuItemClickedThatShouldntCloseDropdown()}>
					<Form.Check type="checkbox" id="default-checkbox2" label="MERS-CoV" onChange={event => this.updateVirus('MERS-CoV',event.target.checked)} />
				</Dropdown.Item>
				<Dropdown.Item href="#/" onClick={() => this.menuItemClickedThatShouldntCloseDropdown()}>
					<Form.Check type="checkbox" id="default-checkbox3" label="SARS-CoV" onChange={event => this.updateVirus('SARS-CoV',event.target.checked)} />
				</Dropdown.Item>
			</Dropdown.Menu>
		</Dropdown>

		{/* End of Topbar */}
	</nav>
	)
	}
}

export default Topbar