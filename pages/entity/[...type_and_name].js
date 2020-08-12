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
			viruses: ['MERS-CoV','SARS-CoV','SARS-CoV-2'],
			windowWidth: null
			}
			
		this.handleResize = this.handleResize.bind(this);
		this.updateViruses = this.updateViruses.bind(this);
	}
	
	handleResize(windowWidth) {
		this.setState({windowWidth:windowWidth})
	}
	
	updateViruses(viruses) {
		this.setState({viruses: viruses})
	}

	render() {
		if(!this.props.fallback_complete)
			return <Layout loading={true}></Layout>
		if (!this.props.entity)
			return <Layout error404={true}></Layout>
					
		const defaultColumns = ["Virus","topic","journal","publish_timestamp","title","altmetric_score"]
			
		const table = <CustomTable defaultColumns={defaultColumns} data={this.props.tabledata} viruses={this.state.viruses} updateViruses={this.updateViruses} windowWidth={this.state.windowWidth} />
		
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
			<Layout title={this.props.entity.entity_name} page={null} viruses={this.state.viruses} updateViruses={this.updateViruses} showVirusSelector handleResize={this.handleResize}>
		
				{imgOrMap}
		
				<div className="d-sm-flex align-items-center justify-content-between mb-4 titlepadding">
					<h3 className="h3 mb-0 text-gray-800">{this.props.entity.entity_name} [{this.props.entity.entity_type}]</h3>
				</div>
							
				<div className="titlepadding">
					{wikidataLink}
				</div>
				
				{table}
				
			</Layout>
		)
	}
}

