import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../components/Layout.js'
import CustomTable from '../components/CustomTable.js'
import SharePopover from '../components/SharePopover.js'

import pages from '../lib/pages.json'
import viruscolors from '../lib/viruscolors.json'
import { getTableData, getChartDataByVirusInCategory } from '../lib/db-main.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { faShareAlt } from '@fortawesome/free-solid-svg-icons'
import { Bar } from 'react-chartjs-2';

export async function getStaticPaths() {
	const paths = pages.map(function(p) {
		return { params: {id: p.page} }
	} )
	
	//const paths = []
	
	return {
		paths,
		fallback: false
	}
}

export async function getStaticProps({ params }) {
	const matching_pages = pages.filter(p => p.page == params.id)
	if (matching_pages.length != 1) {
		return { props: { fallback_complete: true } }
	}
	
	const page_info = matching_pages[0];
	
	const dbCategoryName = 'altname' in page_info ? page_info.altname : page_info.name
	
	const tabledata = await getTableData(page_info)
	
	const chartdata = 'chart_entity' in page_info ? await getChartDataByVirusInCategory(dbCategoryName,page_info.chart_entity,30) : null
	
	return {
		props: {
			fallback_complete: true,
			tabledata,
			chartdata,
			page_info
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
		
		this.shareDiv = React.createRef();
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
		if (!this.props.page_info)
			return <Layout error404={true} handleResize={this.handleResize}></Layout>
		
		const extraColumns = 'extra_table_columns' in this.props.page_info ? this.props.page_info.extra_table_columns : [];
		
		var defaultColumns = [
				"Virus",
				...extraColumns,
				"journal",
				"publish_timestamp",
				"title"
			]
		
		var barChart = <div></div>
		if (this.props.chartdata) {			
			var virus_text = this.state.viruses.join(',')
			
			var chosenData = this.props.chartdata[virus_text]
			
			var bardata = {
				labels: chosenData.labels.slice(),
				datasets: chosenData.datasets.map( dataset => { return {label:dataset.label, data:dataset.data.slice()} } )
			}
			
			bardata.datasets.forEach(dataset => {
				var rgb = viruscolors[dataset.label]
				dataset.backgroundColor = "rgba("+rgb+", 0.9)"
				dataset.borderColor = "rgba("+rgb+", 0.9)"
			})
			
			const minNumberToShow = 10, lowerWidthCutoff = 500
			const maxNumberToShow = 30, upperWidthCutoff = 1000
			
			var numberToShow = minNumberToShow
			if (this.state.windowWidth == null) {
				numberToShow = minNumberToShow
			} else if (this.state.windowWidth < lowerWidthCutoff) {
				numberToShow = minNumberToShow
			} else if (this.state.windowWidth > upperWidthCutoff) {
				numberToShow = maxNumberToShow
			} else {
				const alpha = (this.state.windowWidth-lowerWidthCutoff) / (upperWidthCutoff-lowerWidthCutoff)
				numberToShow = Math.round(minNumberToShow + alpha * (maxNumberToShow-minNumberToShow))
			} 
			
			bardata.labels = bardata.labels.slice(0,numberToShow)
			bardata.datasets.forEach(ds => { ds.data = ds.data.slice(0,numberToShow)} )
			
			var baroptions = {
				maintainAspectRatio: false, 
				responsive: true,
				
				scales: {
					xAxes: [{
						stacked: true,
						ticks: {
							autoSkip: false
						}
					}],
					yAxes: [{
						stacked: true
					}]
				}
				
			}
			
			barChart = (<div style={{position: 'relative', width:'100%', minHeight:'300px'}}>
						<Bar
						  data={bardata}
						  options={baroptions}
						  onElementsClick={elems => this.barClick(elems)}
						/>
					</div>)
		}
				
		const table = <CustomTable defaultColumns={defaultColumns} sort="publish_timestamp" data={this.props.tabledata} viruses={this.state.viruses} updateViruses={this.updateViruses} windowWidth={this.state.windowWidth} />

		return (
			<Layout title={this.props.page_info.name} page={this.props.page_info.page} viruses={this.state.viruses} updateViruses={this.updateViruses} showVirusSelector handleResize={this.handleResize}>
		
				{/* Page Heading */}
				<div className="flex align-items-center justify-content-between mb-4 titlepadding" ref={this.shareDiv} style={{position:"relative"}}>
					<h1 className="h3 mb-0 text-gray-800">{this.props.page_info.name}</h1>
					
					<div>
						<SharePopover title={"Check out " + this.props.page_info.name + " research articles at CoronaCentral!"}  url={"https://coronacentral.ai/" + this.props.page_info.page} container={this.shareDiv}>
							<a href="#" onClick={event => event.preventDefault()} className="inline-block btn btn-sm btn-info shadow-sm" target="_blank">
								<span className="text-white-50"><FontAwesomeIcon icon={faShareAlt} size="sm" width="0" /></span> Share
							</a>
						</SharePopover>
					</div>
				</div>
				
				<div className="d-sm-flex align-items-center justify-content-between mb-4 titlepadding">
					<h6 className="h6 mb-0 text-gray-800">{ this.props.page_info.description ? this.props.page_info.description : ""}</h6>
				</div>
				
				{barChart}

				{table}

			</Layout>
		)
	}
}

