import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../components/Layout.js'
import CustomTable from '../components/CustomTable.js'
import pages from '../lib/pages.json'
import { searchTitleAbstracts } from '../lib/db-search.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { Bar } from 'react-chartjs-2';

export async function getServerSideProps(context) {
	//console.log(context)
	var tabledata = []
	const query = 'q' in context.query ? context.query.q : ''
	if (query) {
		tabledata = await searchTitleAbstracts(query)
	}
	
	return {
		props: {
			fallback_complete: true,
			query,
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
		
		this.barClick = this.barClick.bind(this);
		this.updateViruses = this.updateViruses.bind(this);
		this.downloadJSON = this.downloadJSON.bind(this);
		this.handleResize = this.handleResize.bind(this);
	}
	
	handleResize(windowWidth) {
		this.setState({windowWidth:windowWidth})
	}

	barClick(elems) {
		console.log(elems)
	}
	
	updateViruses(viruses) {
		this.setState({viruses: viruses})
	}
	
	// https://codepen.io/Jacqueline34/pen/pyVoWr
	downloadJSON(event, data) {
		const link = document.createElement('a')

		var json = JSON.stringify(data)
		const filename = 'search_results.json'
		
		json = `data:text/json;charset=utf-8,${json}`

		link.setAttribute('href', encodeURI(json))
		link.setAttribute('download', filename)
		link.click()
		
		event.preventDefault()
	}
	

	render() {
		if(!this.props.fallback_complete)
			return <Layout loading={true} handleResize={this.handleResize}></Layout>
		if (!this.props.tabledata)
			return <Layout error404={true} handleResize={this.handleResize}></Layout>
		
		const defaultColumns = ["Virus","category","journal","publish_timestamp","title","altmetric_score"]
				
		const filteredDataNoAltmetric = this.props.tabledata.map( row => {
			var newRow = {}
			Object.keys(row).forEach( k => {
				if (!k.includes('altmetric'))
					newRow[k] = row[k]
			})
			return newRow
		})
		
		const table = <CustomTable defaultColumns={defaultColumns} data={this.props.tabledata} viruses={this.state.viruses} updateViruses={this.updateViruses} windowWidth={this.state.windowWidth} />
		
		/*const downloadButton = <a href="#" onClick={event => this.downloadJSON(event,filteredDataNoAltmetric)} className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
						<span className="text-white-50"><FontAwesomeIcon icon={faDownload} size="sm" width="0" /></span> Download Data
					</a>*/
		const downloadButton = ""

		return (
			<Layout title="Search Results" page="/search" viruses={this.state.viruses} updateViruses={this.updateViruses} showVirusSelector handleResize={this.handleResize}>
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4 titlepadding">
					<h1 className="h3 mb-0 text-gray-800">Search Results for {'"'+this.props.query+'"'}</h1>
					{downloadButton}
				</div>
						
				{table}

			</Layout>
		)
	}
}

