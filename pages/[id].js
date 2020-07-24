import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../components/Layout.js'
import CustomTable from '../components/CustomTable.js'
import pages from '../lib/pages.json'
import { getTableData, getChartDataByVirusInTopic } from '../lib/db-main.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { Bar } from 'react-chartjs-2';

export async function getStaticPaths() {
	/*const paths = pages.map(function(p) {
		return { params: {id: p.page} }
	} )*/
	
	const paths = []
	
	return {
		paths,
		fallback: true
	}
}

export async function getStaticProps({ params }) {
	const matching_pages = pages.filter(p => p.page == params.id)
	if (matching_pages.length != 1) {
		return { props: { fallback_complete: true } }
	}
	
	const page_info = matching_pages[0];
	
	const tabledata = await getTableData(page_info.name)
	
	const chartdata = 'chart_entity' in page_info ? await getChartDataByVirusInTopic(page_info.name,page_info.chart_entity,30) : null
	
	//console.log(chartdata)
	
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
			viruses: ['MERS-CoV','SARS-CoV','SARS-CoV-2']
			}
		
		this.barClick = this.barClick.bind(this);
		this.updateViruses = this.updateViruses.bind(this);
		this.filterForVirus = this.filterForVirus.bind(this);
		this.downloadJSON = this.downloadJSON.bind(this);
	}

	barClick(elems) {
		console.log(elems)
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
		if(!this.props.fallback_complete)
			return <Layout loading={true}></Layout>
		if (!this.props.page_info)
			return <Layout error404={true}></Layout>
		
		const extra_columns = 'extra_table_columns' in this.props.page_info ? this.props.page_info.extra_table_columns : [];
		
		var columns = [
				{ "header":"Virus", "selector":"entities:Virus" },
				...extra_columns,
				{ "header":"Journal", "selector":"journal", "width":"20%" },
				{ "header":"Date", "selector":"publish_date", "width":"13%" },
				{ "header":"Title", "selector":"title", linkInternal: true }
			]
		
		var barChart = <div></div>
		if (this.props.chartdata) {			
			var virus_text = this.state.viruses.join(',')
			
			var chosenData = this.props.chartdata[virus_text]
			
			var bardata = {
				labels: chosenData.labels.slice(),
				datasets: chosenData.datasets.map( dataset => { return {label:dataset.label, data:dataset.data.slice()} } )
			}
			
			var virusColors = {}
			virusColors['SARS-CoV-2'] = '102,194,165'
			virusColors['SARS-CoV'] = '252,141,98'
			virusColors['MERS-CoV'] = '141,160,203'
			
			bardata.datasets.forEach(dataset => {
				var rgb = virusColors[dataset.label]
				dataset.backgroundColor = "rgba("+rgb+", 0.9)"
				dataset.borderColor = "rgba("+rgb+", 0.9)"
			})
			
			var baroptions = {
				maintainAspectRatio: false, 
				
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
			
			barChart = (<div style={{position: 'relative', height:'40vh', width:'100%'}}>
						<Bar
						  data={bardata}
						  width={100}
						  height={50}
						  options={baroptions}
						  onElementsClick={elems => this.barClick(elems)}
						/>
					</div>)
		}
				
		const filteredData = this.props.tabledata.filter(row => this.filterForVirus(row));
		const filteredDataNoAltmetric = filteredData.map( row => {
			var newRow = {}
			Object.keys(row).forEach( k => {
				if (!k.includes('altmetric'))
					newRow[k] = row[k]
			})
			return newRow
		})
		
		const table = <CustomTable columns={columns} data={filteredData} />

		return (
			<Layout title={this.props.page_info.name} page={this.props.page_info.page} updateViruses={this.updateViruses} showVirusSelector>
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">{this.props.page_info.name}</h1>
					<a href="#" onClick={event => this.downloadJSON(event,filteredDataNoAltmetric)} className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
						<span className="text-white-50"><FontAwesomeIcon icon={faDownload} size="sm" /></span> Download Data
					</a>
				</div>
				
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h6 className="h6 mb-0 text-gray-800">{ this.props.page_info.description ? this.props.page_info.description : ""}</h6>
				</div>
				
						{barChart}

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

