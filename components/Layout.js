import React, { Component } from 'react';
import Router from 'next/router';

import Spinner from 'react-bootstrap/Spinner'

import Head from 'next/head'
import Sidebar from '../components/Sidebar.js'
import Topbar from '../components/Topbar.js'

import { initGA, logPageView } from '../lib/analytics.js'

export default class Layout extends Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false
			}
		
		Router.onRouteChangeStart = (url) => {
			// Some page has started loading
			this.setState({loading: true}) // set state to pass to loader prop
			//console.log('onRouteChangeStart')
		};

		Router.onRouteChangeComplete = (url) => {
			// Some page has finished loading
			this.setState({loading: false}) // set state to pass to loader prop
			//console.log('onRouteChangeComplete')
		};

		Router.onRouteChangeError = (err, url) => {
			// an error occurred.
			// some error logic
		}; 
	}
	
	componentDidMount () {
		if (!window.GA_INITIALIZED) {
			initGA()
			window.GA_INITIALIZED = true
		}
		logPageView(this.props.title)
	}
	
	componentDidUpdate() {
		if (!window.GA_INITIALIZED) {
			initGA()
			window.GA_INITIALIZED = true
		}
		logPageView(this.props.title)
	}
	
	render() {
		const projectName = "CoronaHub"
		/*const loading = <Spinner animation="border" role="status">
							  <span className="sr-only">Loading...</span>
							</Spinner>*/
						
		const loading = <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
					<Spinner animation="border" role="status" style={{width: "3rem", height: "3rem"}}>
						<span className="sr-only">Loading...</span>
					</Spinner>
				</div>
		
		return (
			<div id="wrapper">
				{/* Page Wrapper */}
				<Head>
					<title>{this.props.title + " | " + projectName}</title>
					<link rel="icon" href="/favicon.png" type="image/png" />
				</Head>

				<Sidebar projectName={projectName} page={this.props.page} />

				{/* Content Wrapper */}
				<div id="content-wrapper" className="d-flex flex-column">

					{/* Main Content */}
					<div id="content">

						<Topbar updateVirus={this.props.updateVirus} showVirusSelector={this.props.showVirusSelector} />

						{/* Begin Page Content */}
						<div className="container-fluid">
							{this.state.loading ? loading : this.props.children}
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
