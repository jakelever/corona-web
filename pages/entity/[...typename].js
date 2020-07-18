import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../../components/Layout.js'
import CustomTable from '../../components/CustomTable.js'
import { getAllEntities } from '../../lib/db-entity.js'
import { getEntity, getPapersWithEntity } from '../../lib/db-entity.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { Bar } from 'react-chartjs-2';


export async function getStaticPaths() {
	// A workaround for NextJS error (below) with fallback: true
	// Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
	const isDevelopment = (process.env.NODE_ENV == 'development')
	const entities = isDevelopment ? await getAllEntities() : []
	
	const paths = entities.map( e => {
		return {params: {typename: [e.entity_type,e.entity_name]}}
	} )
	
	return {
		paths,
		fallback: true
	}
}

export async function getStaticProps({ params }) {
	const [ entity_type, entity_name ] = params.typename
	
	const entity = await getEntity(entity_type, entity_name)
	const tableData = await getPapersWithEntity(entity.entity_id)
	
	return {
		props: {
			entity,
			tableData
		}
	}
}

export default class EntityPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: []
			}
	}

	render() {
		if (!this.props.entity)
			return <Layout loading={true}></Layout>
		
		var columns = [
				{ "header":"Virus", "selector":"entities:Virus" },
				{ "header":"Topics", "selector":"entities:topic" },
				{ "header":"Journal", "selector":"journal" },
				{ "header":"Date", "selector":"publish_date", "width":"10%" },
				{ "header":"Title", "selector":"title", linkInternal: true }
			]
			
		const table = <CustomTable columns={columns} data={this.props.tableData} />

		return (
			<Layout title={this.props.entity.entity_name} page={null}>
		
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">{this.props.entity.entity_name}</h1>
					
				</div>
				
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h6 className="h6 mb-0 text-gray-800">Wikidata: <a href={"https://www.wikidata.org/wiki/"+this.props.entity.external_id} target="_blank">{this.props.entity.external_id}</a></h6>
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

