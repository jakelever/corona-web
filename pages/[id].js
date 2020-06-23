import React, { Component } from 'react';
import Layout from '../components/Layout.js'
import Table from '../components/Table.js'
import FlagModal from '../components/FlagModal.js'


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { faSortDown } from '@fortawesome/free-solid-svg-icons'
import { faExclamationCircle, faExclamationTriangle, faExclamation } from '@fortawesome/free-solid-svg-icons'

import Link from 'next/link'

import { Bar } from 'react-chartjs-2';

import pages from '../lib/pages.json'

import { getTableData, getChartDataByVirus } from '../lib/db-main.js'

import DataTable from 'react-data-table-component';

export async function getStaticPaths() {
	//console.log(pages)
	const paths = pages.map(function(p) {
		return { params: {id: p.page} }
	} )
	//console.log(paths)
	//const paths = [{ params: {id: 'DrugRepurposing'}}]
	return {
		paths,
		fallback: false
	}
}

export async function getStaticProps({ params }) {
	const page_info = pages.filter(p => p.page == params.id)[0];
	
	const tabledata = await getTableData(page_info.name)
	
	//const chartdata = 'chart_entity' in page_info ? await getChartDataByVirus(page_info.name,page_info.chart_entity) : null
	
	const chartdata = 'chart_entity' in page_info ? {
		'': await getChartDataByVirus(page_info.name,page_info.chart_entity),
		'MERS-CoV': await getChartDataByVirus(page_info.name,page_info.chart_entity,['MERS-CoV']),
		'SARS-CoV': await getChartDataByVirus(page_info.name,page_info.chart_entity,['SARS-CoV']),
		'SARS-CoV-2': await getChartDataByVirus(page_info.name,page_info.chart_entity,['SARS-CoV-2']),
		'MERS-CoV,SARS-CoV': await getChartDataByVirus(page_info.name,page_info.chart_entity,['MERS-CoV','SARS-CoV']),
		'MERS-CoV,SARS-CoV-2': await getChartDataByVirus(page_info.name,page_info.chart_entity,['SARS-CoV-2','MERS-CoV']),
		'SARS-CoV,SARS-CoV-2': await getChartDataByVirus(page_info.name,page_info.chart_entity,['SARS-CoV-2','SARS-CoV']),
		'MERS-CoV,SARS-CoV,SARS-CoV-2': await getChartDataByVirus(page_info.name,page_info.chart_entity)
	} : null
	
	return {
		props: {
			tabledata,
			chartdata,
			page_info
		}
	}
}

class Page extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: [],
			showFlagModal: false,
			flagModalDoc: null
			}
		
		this.barClick = this.barClick.bind(this);
		this.updateVirus = this.updateVirus.bind(this);
		this.filterForVirus = this.filterForVirus.bind(this);
		this.downloadJSON = this.downloadJSON.bind(this);
		this.closeFlagModal = this.closeFlagModal.bind(this);
		this.showFlagModal = this.showFlagModal.bind(this);
	}
	
	closeFlagModal() {
		this.setState({showFlagModal: false})
	}
	
	showFlagModal(doc) {
		this.setState({showFlagModal: true, flagModalDoc:doc })
	}

	barClick(elems) {
		console.log(elems)
	}
	
	updateVirus(virus,state) {
		var new_selected_viruses = this.state.viruses.filter(v => (v!=virus))
		
		if (state == true) {
			new_selected_viruses.push(virus)
		}
		
		//console.log(new_selected_viruses)
				
		this.setState({viruses: new_selected_viruses.sort()})
	}
	
	
	filterForVirus(row) {
		if (this.state.viruses.length == 0)
			return true;
		
		var row_viruses = row['entities'].filter(e => e['type'] == 'virus').map(e => e['name']);
		var overlap = this.state.viruses.filter(v => row_viruses.includes(v))
		return overlap.length > 0
	}
	
	// https://codepen.io/Jacqueline34/pen/pyVoWr
	downloadJSON(event, data) {
		const link = document.createElement('a')
		/*let csv = convertArrayOfObjectsToCSV(array);
		if (csv == null) return;

		const filename = 'export.csv';

		if (!csv.match(/^data:text\/csv/i)) {
			csv = `data:text/csv;charset=utf-8,${csv}`;
		}*/
		
		var json = JSON.stringify(data)
		const filename = this.props.page_info.page + '.json'
		
		json = `data:text/json;charset=utf-8,${json}`

		link.setAttribute('href', encodeURI(json))
		link.setAttribute('download', filename)
		link.click()
		
		event.preventDefault()
	}
	

	render() {
		//var columns = {Title:'title',Journal:'journal'}
		//console.log(json)
		//json = []
		var columns = {Virus:'entities:virus',...this.props.page_info.table_columns,Journal:'journal','Date':'publish_year',Title:'title'}
		
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
						stacked: true
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
				
		var filteredData = this.props.tabledata.filter(row => this.filterForVirus(row));

		//var res = "hello,i,am,a,csv,file"
		//var data = new Blob([res], {type: 'text/csv'});
		//var csvURL = window.URL.createObjectURL(data);
		
		
		var moo = <a href="/api/hello" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
						<span className="text-white-50"><FontAwesomeIcon icon={faDownload} size="sm" /></span> Download Data
					</a>
					
		/*var dataAsJSON = JSON.stringify(filteredData)
		var baa = <form action="/api/download" method="post">
						<input type="hidden" name="filename" value={this.props.page_info.page + '.json'} />
						<input type="hidden" name="data" value={dataAsJSON} />
						<input className="btn btn-sm btn-sm btn-primary shadow-sm" type="submit" value="Download" />
					</form>*/
					
		// 
		
		const customStyles = {
		  headRow: {
			style: {
			  border: 'none',
			},
		  },
		  headCells: {
			style: {
			  color: '#202124',
			  fontSize: '18px',
			},
		  },
		  pagination: {
			style: {
			  border: 'none',
			},
		  },
		}

		
		const table_columns = 
		[
			{
				id: 'viruses',
				name: 'Viruses',
				sortable: false,
				width: '15%',
				style: {
				  fontSize: '16px',
				  padding: '14px'
				},
				wrap: true,
				cell: row => { 
					var viruses = row.entities.filter( e => e.type=='virus' ).map( e => <a href="">{e.name}</a> )
					
					var combined = viruses ? viruses.reduce((prev, curr) => [prev, ', ', curr]) : ''
					
					return combined
				}
			},
			{
				id: 'journal',
				name: 'Journal',
				selector: 'journal',
				sortable: true,
				width: '15%',
				style: {
				  fontSize: '16px',
				  padding: '14px'
				},
				wrap: true
			},
			{
				id: 'year',
				name: 'Year',
				selector: 'publish_year',
				sortable: true,
				width: '100px',
				style: {
				  fontSize: '16px',
				  padding: '14px'
				}
			},
			{
				id: 'title',
				name: 'Title',
				selector: 'title',
				sortable: true,
				wrap: true,
				style: {
				  fontSize: '16px',
				  padding: '14px'
				},
				cell: row => <a href={row.url} target="_blank">{row.title}</a>
			},
			{
				id: 'buttonthing',
				cell: row => <a className="flagtime" href="#" onClick={event => {this.showFlagModal(row); event.preventDefault()}}><FontAwesomeIcon icon={faExclamationTriangle} size="lg" /></a>,
				ignoreRowClick: true,
				allowOverflow: true,
				button: true,
			}
		]
		
		var table
		if (false) {
			table = <Table data={filteredData} columns={columns} loading={false} error={false} />
		} else {
			table = <DataTable
					noHeader
					columns={table_columns}
					data={filteredData}
					defaultSortField="title"
					keyField="uuid"
					customStyles={customStyles}
					pagination
					highlightOnHover
					sortIcon={<FontAwesomeIcon icon={faSortDown} />}
				/>
		}

		return (
			<Layout title={this.props.page_info.name} page={this.props.page_info.page} updateVirus={this.updateVirus}>
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">{this.props.page_info.name}</h1>
					<a href="#" onClick={event => this.downloadJSON(event,filteredData)} className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
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
				
				<FlagModal doc={this.state.flagModalDoc} show={this.state.showFlagModal} closeFunc={this.closeFlagModal} />

			</Layout>
		)
	}
}

export default Page

