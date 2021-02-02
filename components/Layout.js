import React, { Component } from 'react';
import Router from 'next/router'

import Spinner from 'react-bootstrap/Spinner'

import Head from 'next/head'
import Sidebar from '../components/Sidebar.js'
import Topbar from '../components/Topbar.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBomb, faFrown } from '@fortawesome/free-solid-svg-icons'

import { initGA, logPageView } from '../lib/analytics.js'

import { withRouter } from 'next/router'


class Layout extends Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			error: false,
			showSidebar: false,
			windowSize : null
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
			//this.setState({loading: false, error:true})
		};
		
		this.handleResize = this.handleResize.bind(this);
		this.toggleSidebar = this.toggleSidebar.bind(this);
	}
	
	componentDidMount () {
		if (this.props.title) {
			if (!window.GA_INITIALIZED) {
				initGA()
				window.GA_INITIALIZED = true
			}
			logPageView(this.props.title)
		}
		
		this.setState({windowSize: window.innerWidth})
		window.addEventListener("resize", this.handleResize);
		
		if (this.props.handleResize) {
			this.props.handleResize(window.innerWidth)
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
	
	componentWillUnmount() {
		window.addEventListener("resize", null);
    }
	
	handleResize(WindowSize, event) {
		this.setState({windowSize: window.innerWidth})
		
		if (this.props.handleResize) {
			this.props.handleResize(window.innerWidth)
		}
    }
	
	toggleSidebar() {
		this.setState({showSidebar:!this.state.showSidebar})
	}
	
	render() {
		const projectName = "CoronaCentral"
		
		const metaTitle = 'title' in this.props && this.props.page != '/' ? this.props.title + " at " + projectName : projectName
		
		const pageURL = "https://coronacentral.ai" + this.props.router.asPath
		const metadata = <> 
				<meta name="description" content="The entire coronavirus literature categorised and easily searchable by drug, protein, location and more" />

				<meta name="twitter:card"        content="summary" />
				<meta name="twitter:site"        content="@jakelever0" />
				<meta name="twitter:title"       content={metaTitle} />
				<meta name="twitter:description" content="A portal to the entire coronavirus research literature" />
				<meta name="twitter:creator"     content="@jakelever0" />
				<meta name="twitter:image"       content="https://coronacentral.ai/logo.png" />
				<meta name="twitter:image:alt"   content="Logo with two virus spores for Corona Central" />

				<meta property="og:url"                content={pageURL} />
				<meta property="og:type"               content="website" />
				<meta property="og:title"              content={metaTitle} />
				<meta property="og:description"        content="A portal to the entire coronavirus research literature" />
				<meta property="og:image"              content="https://coronacentral.ai/biglogo.png" />
				<meta property="og:image:secure_url"   content="https://coronacentral.ai/biglogo.png" />
				<meta property="og:image:alt"          content="A view of the main page of Corona Central" />

			</>
									
		var content = '', headBlock = '';
		if (this.props.error404) {
			content = <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
					<div style={{textAlign:"center"}}>
					<p><FontAwesomeIcon icon={faFrown} width="0" style={{fontSize:"5em"}}/></p>
					<p>404: Page not found</p>
					</div>
				</div>
			headBlock = <Head>
							<title>Page not found | {projectName}</title>
							<meta name="robots" content="noindex" />
							{metadata}
						</Head>
		} else if (this.state.error || this.props.error) {
			const errorMessage = this.props.errorMessage ? this.props.errorMessage : "An error has occurred!"
			
			content = <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
					<div style={{textAlign:"center"}}>
					<p><FontAwesomeIcon icon={faBomb} width="0" style={{fontSize:"5em"}}/></p>
					<p>{errorMessage}</p>
					</div>
				</div>
			headBlock = <Head>
							<title>Error | {projectName}</title>
							<meta name="robots" content="noindex" />
							{metadata}
						</Head>
		} else if (this.state.loading || ('loading' in this.props && this.props.loading == true)) {
			content = <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
					<Spinner animation="border" role="status" style={{width: "3rem", height: "3rem"}}>
						<span className="sr-only">Loading...</span>
					</Spinner>
				</div>
			headBlock = <Head>
							<meta name="robots" content="noindex" />
							{metadata}
						</Head>
		} else {
										
			const pageTitle = 'title' in this.props ? this.props.title + " | " + projectName : projectName
							
			content = this.props.children
			headBlock = <Head>
					<title>{pageTitle}</title>
					<link rel="icon" href="/favicon.png" type="image/png" />
					{metadata}
				</Head>
		}
		
		const tourMode = ('tourMode' in this.props && this.props.tourMode == true)
		
		const responsiveShow = this.state.showSidebar || tourMode
		
		/*const definitelyShowSidebar = (this.state.windowSize && this.state.windowSize >= 768) || this.state.showSidebar*/
		const sidebar = <Sidebar responsiveShow={responsiveShow} projectName={projectName} page={this.props.page} />
		
		/*<div className="Xd-none Xd-sm-block Xd-md-none">
							<a href="" onClick={event => {this.setState({showSidebar:!this.state.showSidebar}); event.preventDefault()}}>Hello</a>
						</div>*/
						
		//const overflowHack = 'disableOverflowX' in this.props && this.props.disableOverflowX == true ? {} : {'overflow-x': 'hidden'}	
		const overflowHack = tourMode ? {overflowY: 'hidden',overflowX: 'hidden'} : {overflowX: 'hidden'}
		
		// , height:"100px", width:"100px", backgroundColor:"#00FFFF"
		const toastInBottomRight = 'toastInBottomRight' in this.props ? <div style={{position:"fixed", right:"10px", bottom:"10px", zIndex: "2000 !important"}}>{this.props.toastInBottomRight}</div> : <></>
		
		return (
			<div id="wrapper">
				{/* Page Wrapper */}
				
				
				{sidebar}

				{/* Content Wrapper */}
				<div id="content-wrapper" className="d-flex flex-column" style={overflowHack}>

					{/* Main Content */}
					<div id="content" style={overflowHack}>
					
						{headBlock}
						
						
						<Topbar toggleSidebar={this.toggleSidebar} viruses={this.props.viruses} updateViruses={this.props.updateViruses} showVirusSelector={this.props.showVirusSelector} />

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
								<span>Project funded by the <a href="https://www.czbiohub.org/" target="_blank">Chan Zuckerberg Biohub</a> and NLM grant LM05652</span>
							</div>
						</div>
					</footer>
					{/* End of Footer */}

				</div>
				{/* End of Content Wrapper */}

				{toastInBottomRight}
			</div>
		)
	}
}

export default withRouter(Layout)