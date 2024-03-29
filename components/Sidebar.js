import React, { Component } from 'react';
import Collapse from 'react-bootstrap/Collapse';

import MyToolTip from './MyToolTip'

import Link from 'next/link'

import pages from '../lib/pages.json'
import entitypages from '../lib/entitypages.json'

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
import { faChartLine } from '@fortawesome/free-solid-svg-icons'
import { faPenFancy } from '@fortawesome/free-solid-svg-icons'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { faHeadSideVirus } from '@fortawesome/free-solid-svg-icons'
import { faBrain } from '@fortawesome/free-solid-svg-icons'
import { faRandom } from '@fortawesome/free-solid-svg-icons'
import { faQuestion } from '@fortawesome/free-solid-svg-icons'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { faAddressCard } from '@fortawesome/free-solid-svg-icons'
import { faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons'
import { faLandmark } from '@fortawesome/free-solid-svg-icons'
import { faCommentAlt } from '@fortawesome/free-solid-svg-icons'


/*function toggleSidebar(event) {
	$("body").toggleClass("sidebar-toggled");
    $(".sidebar").toggleClass("toggled");
    if ($(".sidebar").hasClass("toggled")) {
      $('.sidebar .collapse').collapse('hide');
    };
	
	console.log(event);
	event.preventDefault();
}*/

export default class Sidebar extends Component {
	constructor(props) {
		super(props) //since we are extending className Table so we have to use super in order to override Component className constructor
		
		this.groups = Array.from(new Set(pages.map(p => p.group)))
		
		var collapseOpen = {'entities':false}
		this.groups.forEach(g => { collapseOpen[g] = false } )
		
		this.state = { 
			collapseOpen: collapseOpen
		}
		
		this.toggleGroup = this.toggleGroup.bind(this);
		
		this.container = React.createRef()
	}
	
	toggleGroup(g) {
		var collapseOpen = {'entities':false}
		this.groups.forEach(g => { collapseOpen[g] = false } )
		
		if (g != null)
			collapseOpen[g] = !this.state.collapseOpen[g]
		
		this.setState({collapseOpen: collapseOpen})
		//event.preventDefault()
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
			faPenFancy:faPenFancy,
			faHeadSideVirus:faHeadSideVirus,
			faBrain:faBrain,
			faRandom:faRandom,
			faLandmark:faLandmark
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
		
		
		var links = [];
		this.groups.forEach( (groupName,j) => {
			const groupPages = pages.filter(p => p.group == groupName)
			
			if (groupPages.length == 1) {
				const p = groupPages[0]
				const tmpLink = <MyToolTip text={p.description} key={'link_'+j} container={this.container}>
					<li className={p.page==this.props.page ? "nav-item active" : "nav-item"}>
						<Link href="/[id]" as={`/${p.page}`} prefetch={false}>
							<a className="nav-link" onClick={event => this.toggleGroup(null)}>
								<span className="icon" style={{marginRight: "0.25rem"}}>
									<FontAwesomeIcon className="sideicon" icon={iconMapping[p.icon]} fixedWidth width="0" />
								</span>
								<span> {p.name}</span>
							</a>
						</Link>
					</li>
				</MyToolTip>
				links.push(tmpLink)
			} else {
				const groupIcon = iconMapping[groupPages[0].icon]
				const groupOpen = this.state.collapseOpen[groupName]
				const groupArrow = groupOpen ? faAngleDown : faAngleRight
				const groupActive = groupPages.map(p => p.page).includes(this.props.page)
				
				const subLinks = groupPages.map( (p,i) => <Link href="/[id]" as={`/${p.page}`} key={"sublink_"+i} prefetch={false}><a className={"collapse-item" + (p.page==this.props.page ? ' active' : '')}><MyToolTip text={p.description} container={this.container}><div>{p.name}</div></MyToolTip></a></Link> )
				
				
				const tmpLink = <li className={groupActive ? "nav-item active" : "nav-item"} key={'link_'+j}>
					<a className="nav-link" href="#" onClick={event => { this.toggleGroup(groupName); event.preventDefault() } } aria-controls="example-collapse-text"
        aria-expanded={false}>
						<span className="icon" style={{marginRight: "0.25rem"}}>
							<FontAwesomeIcon className="sideicon" icon={groupIcon} fixedWidth width="0" />
						</span>
						<span> {groupName}</span>
						<div className="arrow" style={{"float":"right"}}>
							<FontAwesomeIcon icon={groupArrow} fixedWidth width="0" />
						</div>
					</a>
					<Collapse in={groupOpen}>
						<div className="collapsebox">
							<div className="bg-white py-2 collapse-inner rounded" style={{wordWrap:"break-word"}} >
								{subLinks}
							</div>
						</div>
					</Collapse>
				  </li>
				links.push(tmpLink)
			}
		
		});

		const showClass = this.props.responsiveShow || this.props.responsiveShow ? "sidebar-responsive-show" : "sidebar-responsive-hide"
	// 	<Collapse in={this.props.show} dimension="width" className="" timeout={10000}><div style={{padding: 0, margin:0, backgroundColor:"#00FF00"}}>
		
		const allEntityPages = entitypages.map( (p,i) => `/entity/${p.entity_type}/all` )
		const groupIcon = faCommentAlt
		const groupOpen = this.state.collapseOpen['entities']
		const groupArrow = groupOpen ? faAngleDown : faAngleRight
		const groupActive = allEntityPages.includes(this.props.page)
		const subLinks = entitypages.map( (p,i) => <Link href="/entity/[...type_and_name]" as={`/entity/${p.entity_type}/all`} key={"subentitylink_"+i} prefetch={false}><a className={"collapse-item" + (this.props.page == `/entity/${p.entity_type}/all` ? ' active' : '')}><MyToolTip text={p.description} container={this.container}><div>{p.name}</div></MyToolTip></a></Link> )
		
		const entitylinks = 
			<MyToolTip text="Lists of different biomedical entities (e.g. Drugs) mentioned in published articles" container={this.container}>
			<li className={groupActive ? "nav-item active" : "nav-item"}>
				<a className="nav-link" href="#" onClick={event => { this.toggleGroup('entities'); event.preventDefault() } } aria-controls="example-collapse-text"
	aria-expanded={false}>
					<span className="icon" style={{marginRight: "0.25rem"}}>
						<FontAwesomeIcon className="sideicon" icon={groupIcon} fixedWidth width="0" />
					</span>
					<span> Mentions</span>
					<div className="arrow" style={{"float":"right"}}>
						<FontAwesomeIcon icon={groupArrow} fixedWidth width="0" />
					</div>
				</a>
				<Collapse in={groupOpen}>
					<div className="collapsebox">
						<div className="bg-white py-2 collapse-inner rounded" style={{wordWrap:"break-word"}} >
							{subLinks}
						</div>
					</div>
				</Collapse>
			  </li>
			  </MyToolTip>
		
		return (
	<ul className={"navbar-nav bg-gradient-primary sidebar sidebar-dark accordion " + showClass} id="accordionSidebar" style={{position:"relative"}} ref={this.container}>

		{/* Sidebar - Brand */}
		<Link href="/index" as="/" prefetch={false}>
			<a className="sidebar-brand d-flex align-items-center justify-content-center">
				<div>
					<FontAwesomeIcon icon={faViruses} size="2x" width="0" />
				</div>
				<div className="sidebar-brand-text mx-2">{this.props.projectName}</div>
			</a>
		</Link>

		{/* Divider */}
		<hr className="sidebar-divider my-0" />

		{/* Nav Item - Dashboard */}
		<MyToolTip text="Overview of the coronavirus literature" container={this.container}>
			<li className={this.props.page=='/' ? "nav-item active" : "nav-item"}>
				<Link href="/index" as="/" prefetch={false}>
					<a className="nav-link">
						<span style={{marginRight: "0.25rem"}} >
							<FontAwesomeIcon className="sideicon" icon={faTachometerAlt} fixedWidth width="0" />
						</span>
						<span> Dashboard</span>
					</a>
				</Link>
			</li>
		</MyToolTip>

		{/* Divider */}
		<hr className="sidebar-divider my-0" />
		
		<div className="tour-trending m-0 p-0">
		<MyToolTip text="Articles from the last two weeks across all topics and article types" container={this.container}>
			<li className={this.props.page=='/trending' ? "nav-item active mb-0" : "nav-item mb-0"}>
				<Link href="/trending" as="/trending" prefetch={false}>
					<a className="nav-link">
						<span style={{marginRight: "0.25rem"}}>
							<FontAwesomeIcon className="sideicon" icon={faChartLine} fixedWidth width="0" />
						</span>
						<span> Recent</span>
					</a>
				</Link>
			</li>
		</MyToolTip>
		</div>
		
		<hr className="sidebar-divider my-0" />
		
		<div className="tour-categories my-0">
			{links}

			{/* Divider */}
			<hr className="sidebar-divider my-0" />
			
			{entitylinks}
			
			<hr className="sidebar-divider my-0" />
			
			<MyToolTip text="A set of frequently asked questions to answer common inquiries about CoronaCentral and the methods used to build it." container={this.container}>
				<li className={this.props.page=='/faqs' ? "nav-item active" : "nav-item"}>
					<Link href="/faqs" as="/faqs" prefetch={false}>
						<a className="nav-link">
							<span style={{marginRight: "0.25rem"}}>
								<FontAwesomeIcon className="sideicon" icon={faQuestionCircle} fixedWidth width="0" />
							</span>
							<span> FAQs</span>
						</a>
					</Link>
				</li>
			</MyToolTip>
			
			<MyToolTip text="Help us improve this resource by providing feedback or suggestions for the website or specific papers" container={this.container}>
				<li className={this.props.page=='/feedback' ? "nav-item active" : "nav-item"}>
					<Link href="/feedback" as="/feedback" prefetch={false}>
						<a className="nav-link">
							<span style={{marginRight: "0.25rem"}}>
								<FontAwesomeIcon className="sideicon" icon={faEnvelopeOpenText} fixedWidth width="0" />
							</span>
							<span> Feedback</span>
						</a>
					</Link>
				</li>
			</MyToolTip>
		</div>
		


		{/* Sidebar Toggler (Sidebar) */}
		{ /* onClick={event => toggleSidebar(event)} */ }
			{/*<div className="text-center d-none d-md-inline">
			<button className="rounded-circle border-0" id="sidebarToggle"></button>
			</div>*/}

		{/* End of Sidebar */}
	</ul>
		)
	}
}
