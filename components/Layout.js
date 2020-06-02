import Head from 'next/head'
import Sidebar from '../components/Sidebar.js'
import Topbar from '../components/Topbar.js'

export default function Layout(props) {
	return (
		<div id="wrapper">
			{/* Page Wrapper */}
			<Head>
				<title>{props.title}</title>
			</Head>

			<Sidebar page={props.page} />

			{/* Content Wrapper */}
			<div id="content-wrapper" className="d-flex flex-column">

				{/* Main Content */}
				<div id="content">

					<Topbar updateVirus={props.updateVirus} />

					{/* Begin Page Content */}
					<div className="container-fluid">
						{props.children}
					</div>
					{/* /.container-fluid */}
					
				</div>
				{/* End of Main Content */}
					
					{/* Footer */}
				<footer className="sticky-footer bg-white">
					<div className="container my-auto">
						<div className="copyright text-center my-auto">
							<span>All data (where possible) are released under a Creative Commons Zero (CC0) licence.</span>
						</div>
					</div>
				</footer>
				{/* End of Footer */}

			</div>
			{/* End of Content Wrapper */}

		</div>
	)
}