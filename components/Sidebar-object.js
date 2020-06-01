import Link from 'next/link'
import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faViruses } from '@fortawesome/free-solid-svg-icons'
import { faTachometerAlt } from '@fortawesome/free-solid-svg-icons'
import { faPrescriptionBottleAlt } from '@fortawesome/free-solid-svg-icons'
import { faVials } from '@fortawesome/free-solid-svg-icons'
import { faChessKnight } from '@fortawesome/free-solid-svg-icons'
import { faCamera } from '@fortawesome/free-solid-svg-icons'
import { faHandshake } from '@fortawesome/free-solid-svg-icons'
import { faNotesMedical } from '@fortawesome/free-solid-svg-icons'
import { faStethoscope } from '@fortawesome/free-solid-svg-icons'
import { faSyringe } from '@fortawesome/free-solid-svg-icons'
import { faDna } from '@fortawesome/free-solid-svg-icons'
import { faMicroscope } from '@fortawesome/free-solid-svg-icons'
import { faChartBar } from '@fortawesome/free-solid-svg-icons'

import { dom } from '@fortawesome/fontawesome-svg-core'
 

import pages from '../lib/pages.json'


class Sidebar extends Component {
	constructor(props) {
		super(props)
		this.state = {toggled: true}
		
		this.toggleSidebar = this.toggleSidebar.bind(this);
	}
	
	
	toggleSidebar(event) {
		console.log(event);
		event.preventDefault();
	}
	
	render() {
		const iconMapping = {
			faViruses:faViruses,
			faTachometerAlt:faTachometerAlt,
			faPrescriptionBottleAlt:faPrescriptionBottleAlt,
			faVials:faVials,
			faChessKnight:faChessKnight,
			faCamera:faCamera,
			faHandshake:faHandshake,
			faNotesMedical:faNotesMedical,
			faStethoscope:faStethoscope,
			faSyringe:faSyringe,
			faDna:faDna,
			faMicroscope:faMicroscope,
			faChartBar:faChartBar,
		}
		
		//<i className="fas fa-fw fa-chart-area"></i>
		
		//dom.watch()
		
		const hover = {
			
			'& a': {
				textDecoration: 'none',
				color: '#0000ee',
			},
			':hover': {
				color: '#0000ff',
			}
		};

		// color: "color: rgba(255, 255, 255, 0.1)"
		// <i className="fas fa-fw fa-chart-area"></i>
		var links = pages.map( (p,i) => (
			<li className={p.page==this.props.page ? "nav-item active" : "nav-item"} key={'link_'+i}>
				<Link href={p.page}>
					<a className="nav-link">
						<span style={{marginRight: "0.25rem"}}>
							<FontAwesomeIcon icon={iconMapping[p.icon]} fixedWidth  />
						</span>
						<span> {p.name}</span>
					</a>
				</Link>
			</li> ) )
		
		//<i className="fas fa-fw fa-tachometer-alt"></i>
		/* Sidebar */
		return (
		
	<ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">

		{/* Sidebar - Brand */}
		<Link href="/">
			<a className="sidebar-brand d-flex align-items-center justify-content-center">
				<div>
					<FontAwesomeIcon icon={faViruses} size="2x" />
				</div>
				<div className="sidebar-brand-text mx-3">CoronaHub</div>
			</a>
		</Link>

		{/* Divider */}
		<hr className="sidebar-divider my-0" />

		{/* Nav Item - Dashboard */}
		<li className={this.props.page=='/' ? "nav-item active" : "nav-item"}>
			<Link href="/">
				<a className="nav-link">
					<span style={{marginRight: "0.25rem"}} >
						<FontAwesomeIcon icon={faTachometerAlt} fixedWidth />
					</span>
					<span> Dashboard</span>
				</a>
			</Link>
		</li>

		{/* Divider */}
		<hr className="sidebar-divider" />
		
		{links}

		{/* Divider */}
		<hr className="sidebar-divider d-none d-md-block" />

		{/* Sidebar Toggler (Sidebar) */}
		<div className="text-center d-none d-md-inline">
			<button className="rounded-circle border-0" id="sidebarToggle" onClick={event => this.toggleSidebar(event)}></button>
		</div>

		{/* End of Sidebar */}
	</ul>

		)
	}
}

export default Sidebar;