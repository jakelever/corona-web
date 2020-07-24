import React, { Component } from 'react';
import Router from 'next/router';

import Spinner from 'react-bootstrap/Spinner'

import Head from 'next/head'
import Sidebar from '../components/Sidebar.js'
import Topbar from '../components/Topbar.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBomb } from '@fortawesome/free-solid-svg-icons'

import { initGA, logPageView } from '../lib/analytics.js'

export default class Layout extends Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			error: false
			}
		
		Router.onRouteChangeStart = (url) => {
			// Some page has started loading
			this.setState({loading: true, error:false}) // set state to pass to loader prop
			//console.log('onRouteChangeStart')
		};

		Router.onRouteChangeComplete = (url) => {
			// Some page has finished loading
			this.setState({loading: false, error:false}) // set state to pass to loader prop
			//console.log('onRouteChangeComplete')
		};

		Router.onRouteChangeError = (err, url) => {
			// an error occurred.
			// some error logic
			this.setState({loading: false, error:true})
		}; 
	}
	
	componentDidMount () {
		if (this.props.title) {
			if (!window.GA_INITIALIZED) {
				initGA()
				window.GA_INITIALIZED = true
			}
			logPageView(this.props.title)
		}
	}
	
	componentDidUpdate() {
		if (this.props.title) {
			if (!window.GA_INITIALIZED) {
				initGA()
				window.GA_INITIALIZED = true
			}
			logPageView(this.props.title)
		}
	}
	
	render() {
		const projectName = ""
		/*const loading = <Spinner animation="border" role="status">
							  <span className="sr-only">Loading...</span>
							</Spinner>*/

									
		var content = '', headBlock = '';
		if (this.props.error404) {
			content = <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
					<div style={{textAlign:"center"}}>
					<p><FontAwesomeIcon icon={faBomb} style={{fontSize:"5em"}}/></p>
					<p>404: Page not found</p>
					</div>
				</div>
			headBlock = <Head>
							<title>Page not found | {projectName}</title>
							<meta name="robots" content="noindex" />
						</Head>
		} else if (this.state.error) {
			content = <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
					<div style={{textAlign:"center"}}>
					<p><FontAwesomeIcon icon={faBomb} style={{fontSize:"5em"}}/></p>
					<p>An error has occurred!</p>
					</div>
				</div>
			headBlock = <Head>
							<title>Error | {projectName}</title>
							<meta name="robots" content="noindex" />
						</Head>
		} else if (this.state.loading || ('loading' in this.props && this.props.loading == true)) {
			content = <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
					<Spinner animation="border" role="status" style={{width: "3rem", height: "3rem"}}>
						<span className="sr-only">Loading...</span>
					</Spinner>
				</div>
			headBlock = <Head>
							<meta name="robots" content="noindex" />
						</Head>
		} else {
										
			const pageTitle = 'title' in this.props ? this.props.title + " | " + projectName : projectName
							
			content = this.props.children
			headBlock = <Head>
					<title>{pageTitle}</title>
					<link rel="icon" href="/favicon.png" type="image/png" />
				</Head>
		}
		
		return (
			<div id="wrapper">
				{/* Page Wrapper */}
				

				<Sidebar projectName={projectName} page={this.props.page} />

				{/* Content Wrapper */}
				<div id="content-wrapper" className="d-flex flex-column">

					{/* Main Content */}
					<div id="content">
					
						{headBlock}

						<Topbar updateViruses={this.props.updateViruses} showVirusSelector={this.props.showVirusSelector} />

						{/* Begin Page Content */}
						<div className="container-fluid">
							{content}
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
