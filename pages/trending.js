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
		this.downloadJSON = this.downloadJSON.bind(this);
	}
	
	handleResize(windowWidth) {
		this.setState({windowWidth:windowWidth})
	}
	
	updateViruses(viruses) {
		this.setState({viruses: viruses})
	}
	
	// https://codepen.io/Jacqueline34/pen/pyVoWr
	downloadJSON(event, data) {
		const link = document.createElement('a')

		var json = JSON.stringify(data)
		const filename = this.props.page_info.page + '.json'
		
		json = `data:text/json;charset=utf-8,${json}`

		link.setAttribute('href', encodeURI(json))
		link.setAttribute('download', filename)
		link.click()
		
		event.preventDefault()
	}
	

	render() {
					
		/*var defaultColumns = [
				{ "header":"Virus", "selector":"entities:Virus", "hide":"md", grow:1 },
				{ "header":"Categories", "selector":"entities:category", grow:2 },
				{ "header":"Journal", "selector":"journal", "hide":"md", grow:1 },
				{ "header":"Date", "selector":"publish_date", "hide":"md", grow:1 },
				{ "header":"Title", "selector":"title", linkInternal: true, grow:4 }
			]*/
			
		const defaultColumns = ["Virus","category","journal","publish_timestamp","title","altmetric_score_1day"]
				
		/*const filteredDataNoAltmetric = filteredData.map( row => {
			var newRow = {}
			Object.keys(row).forEach( k => {
				if (!k.includes('altmetric'))
					newRow[k] = row[k]
			})
			return newRow
		})*/
		
		const table = <CustomTable defaultColumns={defaultColumns} data={this.props.tabledata} showAltmetric1Day sort="altmetric_score_1day" altmetricHide="md" viruses={this.state.viruses} updateViruses={this.updateViruses} windowWidth={this.state.windowWidth} />

		return (
			<Layout title="Trending" page="/trending" viruses={this.state.viruses} updateViruses={this.updateViruses} handleResize={this.handleResize}>
		
				{/* Page Heading */}
				<div className="flex align-items-center justify-content-between mb-4 titlepadding">
					<h1 className="h3 mb-0 text-gray-800">Trending</h1>
					<SharePopover title="Check out the latest trending coronavirus research articles at CoronaCentral!" url="https://coronacentral.ai/trending">
						<a href="#" onClick={event => event.preventDefault()} className="inline-block btn btn-sm btn-info shadow-sm" target="_blank">
							<span className="text-white-50"><FontAwesomeIcon icon={faShareAlt} size="sm" /></span> Share
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

