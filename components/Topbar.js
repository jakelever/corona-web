import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavLink from 'react-bootstrap/NavLink';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Form from 'react-bootstrap/Form';
import Search from '../components/Search.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { faVirus } from '@fortawesome/free-solid-svg-icons'
import { faTwitter } from "@fortawesome/free-brands-svg-icons"

/* Topbar */
export default class Topbar extends Component {
	constructor(props) {
		super(props) //since we are extending className Table so we have to use super in order to override Component className constructor
		this.state = { 
			menuShow: false
		}
		
		this.dropdownToggle = this.dropdownToggle.bind(this);
		
		this.toggleVirus = this.toggleVirus.bind(this);
		this.toggleSARS = this.toggleSARS.bind(this);
		this.toggleMERS = this.toggleMERS.bind(this);
		this.toggleSARS2 = this.toggleSARS2.bind(this);
	}
	
	toggleVirus(virus) {
		if (this.props.updateViruses) {
			var newViruses = this.props.viruses.slice()
			if (this.props.viruses.includes(virus)) {
				newViruses = newViruses.filter( v => v!=virus)
			} else {
				newViruses.push(virus)
				newViruses = newViruses.sort()
			}
			this.props.updateViruses(newViruses)
		}
	}
	
	toggleSARS() {
		this.toggleVirus('SARS-CoV')
	}
	
	toggleMERS() {
		this.toggleVirus('MERS-CoV')
	}
	
	toggleSARS2() {
		this.toggleVirus('SARS-CoV-2')
	}
	
	dropdownToggle(isOpen,event,metadata){
		
		//if (!isOpen && event != false)
		//	return
		/*const target = event ? event.target : false
		const source = metadata ? metadata.source : false
		
		console.log('dropdownToggle ' + isOpen + ' ' + target + ' ' + metadata + ' ' + source)*/
		/*if (this._forceOpen) {
			this.setState({ menuShow: true });
			this._forceOpen = false;
		} else {
			this.setState({ menuShow: newValue });
		}*/
		
		// Hacky thing to ignore a double event when dropdown is closed
		if (!isOpen && event != false) {
			return
		} else if (this._forceOpen) {
			this._forceOpen = false
		} else if (!isOpen && event==false) {
			//console.log("Hiding!")
			this.setState({ menuShow: false });
		}
	}
	
	render() {
		// 
		var virusButtonText = 'Select virus of interest'
		/*if (this.state.viruses.length == 0 || this.state.viruses == ['MERS-CoV','SARS-CoV','SARS-CoV-2']) {
			virusButtonText = 'Showing SARS-CoV-2, MERS-CoV & SARS-CoV'
		}*/
		
		//  onClick={event => {console.log(event.target)}}
		
		const sarscov2Selected = this.props.viruses ? this.props.viruses.includes('SARS-CoV-2') : false
		const merscovSelected = this.props.viruses ? this.props.viruses.includes('MERS-CoV') : false
		const sarscovSelected = this.props.viruses ? this.props.viruses.includes('SARS-CoV') : false
		
		const virusSelectorBig = <Dropdown show={this.state.menuShow} onToggle={(isOpen,event,metadata) => this.dropdownToggle(isOpen,event,metadata)}>
			<Dropdown.Toggle variant="secondary" id="dropdown-basic" onClick={event => {this.setState({menuShow:!this.state.menuShow})}}>
				{virusButtonText}
			</Dropdown.Toggle>

			<Dropdown.Menu>
				<Dropdown.Item href="#/" onSelect={(eventKey,event) => { this._forceOpen = true; if (event.target.tagName != 'LABEL') { this.toggleSARS2(); } }}>
					<Form.Check type="checkbox" id="dropdown-sars-cov-2" label="SARS-CoV-2" checked={sarscov2Selected} onChange={event => {}} />
				</Dropdown.Item>
				<Dropdown.Item href="#/" onSelect={(eventKey,event) => { this._forceOpen = true; if (event.target.tagName != 'LABEL') { this.toggleMERS(); } }}>
					<Form.Check type="checkbox" id="dropdown-mers-cov" label="MERS-CoV" checked={merscovSelected} onChange={event => {}} />
				</Dropdown.Item>
				<Dropdown.Item href="#/" onSelect={(eventKey,event) => { this._forceOpen = true; if (event.target.tagName != 'LABEL') { this.toggleSARS(); } }}>
					<Form.Check type="checkbox" id="dropdown-sars-cov" label="SARS-CoV" checked={sarscovSelected} onChange={event => {}} />
				</Dropdown.Item>
			</Dropdown.Menu>
		</Dropdown>
		
		const virusSelectorSmall = <Dropdown as={Navbar} show={this.state.menuShow} onToggle={(isOpen,event,metadata) => this.dropdownToggle(isOpen,event,metadata)}>
					<Dropdown.Toggle as={NavLink} variant="secondary" id="dropdown-basic" onClick={event => {this.setState({menuShow:!this.state.menuShow})}}>
						<FontAwesomeIcon icon={faVirus} />
					</Dropdown.Toggle>

					<Dropdown.Menu>
						<Dropdown.Item disabled>
							Select viruses of interest:
						</Dropdown.Item>
						<Dropdown.Divider />
						<Dropdown.Item href="#/" onSelect={(eventKey,event) => { this._forceOpen = true; if (event.target.tagName != 'LABEL') {this.toggleSARS2()}}}>
							<Form.Check type="checkbox" id="dropdown-sars-cov-2" label="SARS-CoV-2" checked={sarscov2Selected} onChange={event => {}} />
						</Dropdown.Item>
						<Dropdown.Item href="#/" onSelect={(eventKey,event) => { this._forceOpen = true; if (event.target.tagName != 'LABEL') {this.toggleMERS()}}}>
							<Form.Check type="checkbox" id="dropdown-mers-cov" label="MERS-CoV" checked={merscovSelected} onChange={event => {}} />
						</Dropdown.Item>
						<Dropdown.Item href="#/" onSelect={(eventKey,event) => { this._forceOpen = true; if (event.target.tagName != 'LABEL') {this.toggleSARS()}}}>
							<Form.Check type="checkbox" id="dropdown-sars-cov" label="SARS-CoV" checked={sarscovSelected} onChange={event => {}} />
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
		
		//<div className="dropdown-menu dropdown-menu-right p-3 shadow animated--grow-in" aria-labelledby="searchDropdown">
				
		// { this.props.showVirusSelector ? <div className="topbar-divider"></div> : <></> }
		
		return (
	<nav className="tour-search navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
		
		{/* Sidebar Toggle (Topbar) */}
		<button id="sidebarToggleTop" className="btn btn-link d-lg-none rounded-circle mr-3 text-secondary" onClick={event => this.props.toggleSidebar()}>
			<FontAwesomeIcon icon={faBars}  />
		</button>

		
		<div className="d-none d-sm-inline-block mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
			<Search />
		</div>
		
		
		{/*<!-- Topbar Navbar -->*/}
		<ul className="navbar-nav ml-auto">

			{/*<!-- Nav Item - Search Dropdown (Visible Only XS) -->*/}
			<li className="nav-item dropdown no-arrow d-sm-none">
			
				
				
				{/*<!-- Dropdown - Messages -->*/}
				<Dropdown as={Navbar}>
					<Dropdown.Toggle as={NavLink} variant="secondary" id="dropdown-basic">
						<FontAwesomeIcon icon={faSearch} />
					</Dropdown.Toggle>

					<Dropdown.Menu>
						<form className="mr-auto w-100 navbar-search">
							<div style={{marginLeft:"1em", marginRight:"1em"}}>
								<Search />
							</div>
						</form>
					</Dropdown.Menu>
				</Dropdown>
			</li>
			
            { this.props.showVirusSelector ? <li className="d-none d-sm-inline-block nav-item" style={{width:"1em"}}></li> : <></> }
			
			
			<div className="tour-virusselector">

			{ this.props.showVirusSelector ? <li className="d-none d-sm-inline-block nav-item">{virusSelectorBig}</li> : <></> }
			
			{ this.props.showVirusSelector ? <li className="nav-item dropdown no-arrow d-sm-none">{virusSelectorSmall}</li> : <></> }
			
			</div>
			
			
            { this.props.showVirusSelector ? <li className="d-none d-sm-inline-block nav-item" style={{width:"1em"}}></li> : <></> }
			
			<NavLink className="d-none d-sm-inline-block" href="https://twitter.com/coronacentralai" target="_blank">
				<FontAwesomeIcon icon={faTwitter} size="lg" />
			</NavLink>
			
			<li className="nav-item dropdown no-arrow d-sm-none">
			
				
				
				{/*<!-- Dropdown - Messages -->*/}
				<Navbar>
					<NavLink href="https://twitter.com/coronacentralai" target="_blank">
						<FontAwesomeIcon icon={faTwitter} />
					</NavLink>
				</Navbar>
			</li>
			
			
		</ul>

		{/* End of Topbar */}
	</nav>
	)
	}
}
