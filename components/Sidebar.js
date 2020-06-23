import Link from 'next/link'

import pages from '../lib/pages.json'

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


/*function toggleSidebar(event) {
	$("body").toggleClass("sidebar-toggled");
    $(".sidebar").toggleClass("toggled");
    if ($(".sidebar").hasClass("toggled")) {
      $('.sidebar .collapse').collapse('hide');
    };
	
	console.log(event);
	event.preventDefault();
}*/

export default function Sidebar(props) {
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

	var links = pages.map( (p,i) => (
		<li className={p.page==props.page ? "nav-item active" : "nav-item"} key={'link_'+i}>
			<Link href="/[id]" as={`/${p.page}`}>
				<a className="nav-link">
					<span style={{marginRight: "0.25rem"}}>
						<FontAwesomeIcon icon={iconMapping[p.icon]} fixedWidth  />
					</span>
					<span> {p.name}</span>
				</a>
			</Link>
		</li> ) )
	
	return (
	
<ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">

	{/* Sidebar - Brand */}
	<Link href="/index" as="/">
		<a className="sidebar-brand d-flex align-items-center justify-content-center">
			<div>
				<FontAwesomeIcon icon={faViruses} size="2x" />
			</div>
			<div className="sidebar-brand-text mx-3">Alpha</div>
		</a>
	</Link>

	{/* Divider */}
	<hr className="sidebar-divider my-0" />

	{/* Nav Item - Dashboard */}
	<li className={props.page=='/' ? "nav-item active" : "nav-item"}>
		<Link href="/index" as="/">
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
	{ /* onClick={event => toggleSidebar(event)} */ }
		{/*<div className="text-center d-none d-md-inline">
		<button className="rounded-circle border-0" id="sidebarToggle"></button>
		</div>*/}

	{/* End of Sidebar */}
</ul>

	)
}
