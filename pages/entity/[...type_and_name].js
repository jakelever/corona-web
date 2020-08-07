import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../../components/Layout.js'
import CustomTable from '../../components/CustomTable.js'
import { getAllEntities } from '../../lib/db-entity.js'
import { getEntity, getPapersWithEntity } from '../../lib/db-entity.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { Bar } from 'react-chartjs-2';

import dynamic from 'next/dynamic'

const DynamicMapComponent = dynamic(
  () => import('../../components/Map'),
  { ssr: false }
)

export async function getStaticPaths() {
	// A workaround for NextJS error (below) with fallback: true
	// Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
	const isDevelopment = (process.env.NODE_ENV == 'development')
	const entities = isDevelopment ? await getAllEntities() : []
	
	const paths = entities.map( e => {
		return {params: {type_and_name: [e.entity_type,e.entity_name]}}
	} )
	
	return {
		paths,
		fallback: true
	}
}

export async function getStaticProps({ params }) {
	const [ entity_type, entity_name ] = params.type_and_name
	
	const entity = await getEntity(entity_type, entity_name)
	const tabledata = entity ? await getPapersWithEntity(entity.entity_id) : null
	
	return {
		props: {
			fallback_complete: true,
			entity,
			tabledata
		}
	}
}

export default class EntityPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: ['MERS-CoV','SARS-CoV','SARS-CoV-2']
			}
			
		this.updateViruses = this.updateViruses.bind(this);
		this.filterForVirus = this.filterForVirus.bind(this);
		
		//this.router = withRouter()
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

	render() {
		if(!this.props.fallback_complete)
			return <Layout loading={true}></Layout>
		if (!this.props.entity)
			return <Layout error404={true}></Layout>
					
		var columns = [
				{ "header":"Virus", "selector":"entities:Virus", "hide":"md", grow:1 },
				{ "header":"Topics", "selector":"entities:topic", grow:2 },
				{ "header":"Journal", "selector":"journal", "hide":"md", grow:1 },
				{ "header":"Date", "selector":"publish_date", "hide":"md", grow:1 },
				{ "header":"Title", "selector":"title", linkInternal: true, grow:4 }
			]
			
		const filteredData = this.props.tabledata.filter(row => this.filterForVirus(row));
			
		const table = <CustomTable columns={columns} data={filteredData}/>
		
		var imgOrMap = ''
		if (this.props.entity.entity_type == 'Location') {
			
			const position = [ this.props.entity.latitude, this.props.entity.longitude ]
			imgOrMap = <div style={{width:"100%",height:"200px"}}>
								<DynamicMapComponent links={false} zoom={3} position={position} height="200px" locations={[{'name':this.props.entity.entity_name,'latitude':position[0],'longitude':position[1]}]} />
							</div>
		}
		
		const externalIDIsLikelyWikidata = this.props.entity.external_id.length >= 2 && this.props.entity.external_id.slice(0,1) == 'Q' && !isNaN(this.props.entity.external_id.slice(1,2))

		const wikidataLink = externalIDIsLikelyWikidata ? <div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h6 className="h6 mb-0 text-gray-800">Wikidata: <a href={"https://www.wikidata.org/wiki/"+this.props.entity.external_id} target="_blank">{this.props.entity.external_id}</a></h6>
				</div> : ''

		return (
			<Layout title={this.props.entity.entity_name} page={null} updateViruses={this.updateViruses} showVirusSelector>
		
				{imgOrMap}
		
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h3 className="h3 mb-0 text-gray-800">{this.props.entity.entity_name} [{this.props.entity.entity_type}]</h3>
				</div>
							
				
				{wikidataLink}
				
				{table}
				
			</Layout>
		)
	}
}

