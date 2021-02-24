import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../../components/Layout.js'
import CustomTable from '../../components/CustomTable.js'
import pages from '../../lib/pages.json'
import { searchTitleAbstracts } from '../../lib/db-search.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { Bar } from 'react-chartjs-2';

//export async function getServerSideProps(context) {
	
export async function getStaticPaths() {
	const paths = []
	
	return {
		paths,
		fallback: true
	}
}
	
export async function getStaticProps({ params }) {	
	const query = params.query.join('/')
	
	var tabledata = []
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

	render() {
		if(!this.props.fallback_complete)
			return <Layout loading={true} handleResize={this.handleResize}></Layout>
		if (!this.props.tabledata)
			return <Layout error404={true} handleResize={this.handleResize}></Layout>
		
		const defaultColumns = ["Virus","category","journal","publish_timestamp","title","altmetric_score"]
				
		const table = <CustomTable defaultColumns={defaultColumns} data={this.props.tabledata} viruses={this.state.viruses} updateViruses={this.updateViruses} windowWidth={this.state.windowWidth} />

		return (
			<Layout title="Search Results" page="/search" viruses={this.state.viruses} updateViruses={this.updateViruses} showVirusSelector handleResize={this.handleResize}>
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4 titlepadding">
					<h1 className="h3 mb-0 text-gray-800">Search Results for {'"'+this.props.query+'"'}</h1>
				</div>
						
				{table}

			</Layout>
		)
	}
}

