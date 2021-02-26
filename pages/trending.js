import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../components/Layout.js'
import CustomTable from '../components/CustomTable.js'
import SharePopover from '../components/SharePopover.js'
import { getTrendingDocuments } from '../lib/db-trending.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { faShareAlt } from '@fortawesome/free-solid-svg-icons'

export async function getStaticProps({ params }) {
	const tabledata = await getTrendingDocuments()
	
	return {
		props: {
			tabledata
		}
	}
}

export default class Page extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: ['MERS-CoV','SARS-CoV','SARS-CoV-2'],
			windowWidth: null
			}
		
		this.handleResize = this.handleResize.bind(this);
		this.updateViruses = this.updateViruses.bind(this);
		
		this.shareDiv = React.createRef();
	}
	
	handleResize(windowWidth) {
		this.setState({windowWidth:windowWidth})
	}
	
	updateViruses(viruses) {
		this.setState({viruses: viruses})
	}

	render() {
					
		const defaultColumns = ["articletype","topic","journal","publish_timestamp","title","altmetric_score_1day"]
		
		const table = <CustomTable defaultColumns={defaultColumns} data={this.props.tabledata} showAltmetric1Day sort="altmetric_score_1day" altmetricHide="md" viruses={this.state.viruses} updateViruses={this.updateViruses} windowWidth={this.state.windowWidth} />

		return (
			<Layout title="Trending" page="/trending" viruses={this.state.viruses} updateViruses={this.updateViruses} handleResize={this.handleResize}>
		
				{/* Page Heading */}
				<div className="flex align-items-center justify-content-between mb-4 titlepadding" ref={this.shareDiv} style={{position:"relative"}}>
					<h1 className="h3 mb-0 text-gray-800">Trending</h1>
					<SharePopover title="Check out the latest trending coronavirus research articles at CoronaCentral!" url="https://coronacentral.ai/trending" container={this.shareDiv}>
						<a href="#" onClick={event => event.preventDefault()} className="inline-block btn btn-sm btn-info shadow-sm" target="_blank">
							<span className="text-white-50"><FontAwesomeIcon icon={faShareAlt} size="sm" width="0" /></span> Share
						</a>
					</SharePopover>
				</div>
				
				<div className="d-sm-flex align-items-center justify-content-between mb-4 titlepadding">
					<h6 className="h6 mb-0 text-gray-800">Articles from the last two weeks that are receiving attention in the media and on social media</h6>
				</div>

								
				{table}
				

			</Layout>
		)
	}
}

