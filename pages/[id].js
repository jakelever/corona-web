import React, { Component } from 'react';
import Layout from '../components/Layout.js'
import Table from '../components/Table.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

import Link from 'next/link'

import { Bar } from 'react-chartjs-2';

import pages from '../lib/pages.json'

import { getTableData, getChartData } from '../lib/db-main.js'


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
	const chartdata = await getChartData(page_info.name)
	
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
			viruses: []
			}
		
		this.barClick = this.barClick.bind(this);
		this.updateVirus = this.updateVirus.bind(this);
		this.filterForVirus = this.filterForVirus.bind(this);
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
				
		this.setState({viruses: new_selected_viruses})
	}
	
	
	filterForVirus(row) {
		if (this.state.viruses.length == 0)
			return true;
		
		var row_viruses = row['entities'].filter(e => e['type'] == 'virus').map(e => e['name']);
		var overlap = this.state.viruses.filter(v => row_viruses.includes(v))
		return overlap.length > 0
	}

	render() {
		//var columns = {Title:'title',Journal:'journal'}
		//console.log(json)
		//json = []
		var columns = {Virus:'entities:virus',...this.props.page_info.table_columns,Journal:'journal','Date':'publish_year',Title:'title'}
		
		var labels = this.props.chartdata.map(c => c.entity_name)
		var counts = this.props.chartdata.map(c => c.count)
		
		var bardata = {
			labels: labels,
			datasets: [{
				label: '# of Votes',
				data: counts,
				backgroundColor: "#3e95cd"
			}]
		}
				
		var filteredData = this.props.tabledata.filter(row => this.filterForVirus(row));

		return (
			<Layout title={this.props.page_info.name} page={this.props.page_info.page} updateVirus={this.updateVirus}>
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">{this.props.page_info.name}</h1>
					<a href="#" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
						<span className="text-white-50"><FontAwesomeIcon icon={faDownload} size="sm" /></span> Download Data
					</a>
				</div>
				
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h6 className="h6 mb-0 text-gray-800">{ this.props.page_info.description ? this.props.page_info.description : ""}</h6>
				</div>
				
				<div style={{position: 'relative', height:'40vh', width:'100%'}}>
					<Bar
					  data={bardata}
					  width={100}
					  height={50}
					  options={{ maintainAspectRatio: false, legend: false }}
					  onElementsClick={elems => this.barClick(elems)}
					/>
				</div>

				<Table data={filteredData} columns={columns} loading={false} error={false} />

			</Layout>
		)
	}
}

export default Page

