import React, { Component } from 'react';
import Head from 'next/head'
import Sidebar from '../components/Sidebar.js'
import Topbar from '../components/Topbar.js'

import { initGA, logPageView } from '../lib/analytics.js'

class Layout extends Component {
	
	componentDidMount () {
		if (!window.GA_INITIALIZED) {
			initGA()
			window.GA_INITIALIZED = true
		}
		logPageView()
	}
	
	render() {
		return (
			<div id="wrapper">
				{/* Page Wrapper */}
				<Head>
					<title>{this.props.title}</title>
				</Head>

				<Sidebar page={this.props.page} />

				{/* Content Wrapper */}
				<div id="content-wrapper" className="d-flex flex-column">

					{/* Main Content */}
					<div id="content">

						<Topbar updateVirus={this.props.updateVirus} />

						{/* Begin Page Content */}
						<div className="container-fluid">
							{this.props.children}
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
}

export default Layout