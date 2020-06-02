import React, { Component } from 'react';
import Layout from '../components/Layout.js'
import Table from '../components/Table.js'

import fetch from 'isomorphic-unfetch'
import Link from 'next/link'

import { Bar } from 'react-chartjs-2';

import pages from '../lib/pages.json'

const db = require('../lib/db')
const escape = require('sql-template-strings')

async function getTableData(topic) {
	var documents = await db.query(escape`

	SELECT d.document_id, d.title, d.url, d.journal, d.publish_year FROM documents d
	JOIN
	(SELECT a.document_id
	FROM annotations a, entities e, entitytypes et 
	WHERE e.entity_name = ${topic} 
		AND et.entitytype_name = 'topic' 
		AND e.entity_id = a.entity_id 
		AND e.entitytype_id = et.entitytype_id) as tmp
	ON d.document_id = tmp.document_id

	`)
	documents = documents.map(r => Object.assign({},r))
	
	const documentToObject = (array) =>
		array.reduce((obj, item) => {
			item.entities = []
			obj[item.document_id] = item
			return obj
		}, {})
	
	var documentsByID = documentToObject(documents)
	
	var annotations = await db.query(escape`
	SELECT a.document_id, e.entity_name, et.entitytype_name 
	FROM annotations a, entities e, entitytypes et 
	WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id
	`)
	annotations = annotations.map(r => Object.assign({},r))
	
	annotations.map(function(anno) {
		if (! (anno.document_id in documentsByID) )
			return false
		
		var doc = documentsByID[anno.document_id]
		const entity_name = anno.entity_name
		const entity_type = anno.entitytype_name
		
		//if (! (entity_type in doc.entities))
		//	doc.entities[entity_type] = []
		
		const entity = {name: entity_name, type: entity_type}
		doc.entities.push(entity)
	})
	
	return Object.values(documentsByID)
}

async function getChartData(topic) {
	var counts = await db.query(escape`

	SELECT entity_name, COUNT(*) as count FROM
		(SELECT e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.entitytype_name = 'drug'
			AND a.document_id IN (
				SELECT a.document_id 
				FROM annotations a, entities e, entitytypes et 
				WHERE e.entity_name = ${topic}
					AND a.entity_id = e.entity_id 
					AND e.entitytype_id = et.entitytype_id 
					AND et.entitytype_name = 'topic'
			)) as tmp1 
	GROUP BY entity_name
	ORDER BY count DESC
	LIMIT 30

	`)
	
	counts = counts.map(r => Object.assign({},r))
	
	return counts
}

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

