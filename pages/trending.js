import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../components/Layout.js'
import CustomTable from '../components/CustomTable.js'
import { getTrendingDocuments } from '../lib/db-trending.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

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
			viruses: []
			}
		
		this.updateViruses = this.updateViruses.bind(this);
		this.filterForVirus = this.filterForVirus.bind(this);
		this.downloadJSON = this.downloadJSON.bind(this);
	}
	
	updateViruses(viruses) {
		this.setState({viruses: viruses})
	}
	
	filterForVirus(row) {
		if (this.state.viruses.length == 0)
			return true;
		
		var row_viruses = row['entities'].filter(e => e['type'] == 'Virus').map(e => e['name']);
		var overlap = this.state.viruses.filter(v => row_viruses.includes(v))
		return overlap.length > 0
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
		
		var columns = [
				{ "header":"Virus", "selector":"entities:Virus" },
				{ "header":"Topics", "selector":"entities:topic", "width":"20%" },
				{ "header":"Journal", "selector":"journal", "width":"20%" },
				{ "header":"Date", "selector":"publish_date", "width":"10%" },
				{ "header":"Title", "selector":"title", linkInternal: true }
			]
				
		const filteredData = this.props.tabledata.filter(row => this.filterForVirus(row));
		const filteredDataNoAltmetric = filteredData.map( row => {
			var newRow = {}
			Object.keys(row).forEach( k => {
				if (!k.includes('altmetric'))
					newRow[k] = row[k]
			})
			return newRow
		})
		
		const table = <CustomTable columns={columns} data={filteredData} showAltmetric1Day sort="altmetric_score_1day" />

		return (
			<Layout title="Trending" page="/trending" updateViruses={this.updateViruses}>
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">Trending</h1>
				</div>
				
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h6 className="h6 mb-0 text-gray-800">Articles that are receiving attention in the media and on social media</h6>
				</div>

				<div className="card shadow mb-4">
					<div className="card-header py-3">
						<h6 className="m-0 font-weight-bold text-primary">Published and Preprint Papers</h6>
					</div>
					<div className="card-body">
						<div className="table-responsive">
								
								{table}
								
						</div>
					</div>
				</div>
				

			</Layout>
		)
	}
}

