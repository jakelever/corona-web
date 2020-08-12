import React, { Component } from 'react';
import Link from 'next/link'
import Layout from '../../components/Layout.js'
import TextWithEntities from '../../components/TextWithEntities.js'
import Button from 'react-bootstrap/Button'

import FlagModal from '../../components/FlagModal.js'

import pages from '../../lib/pages.json'

//import { getAllDocumentIDs } from '../../lib/db-doc.js'
import { getDocument } from '../../lib/db-doc.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

const shortMonths = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export async function getStaticPaths() {
	// A workaround for NextJS error (below)
	// Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
	const isDevelopment = (process.env.NODE_ENV == 'development')
	//const documents = isDevelopment ? await getAllDocumentIDs() : []
	const documents = []
	
	const paths = documents.map(function(d) {
		return { params: {id: d.document_id.toString()} }
	} )
	
	return {
		paths,
		fallback: true
	}
}

export async function getStaticProps({ params }) {
	var identifiers
	if (params.identifiers.length >= 3 && params.identifiers[0] == 'doi') {
		identifiers = { 'doi': params.identifiers.slice(1).join('/') }
	} else if (params.identifiers.length == 2 && params.identifiers[0] == 'pubmed_id') {
		identifiers = { 'pubmed_id': params.identifiers[1] }
	} else if (params.identifiers.length == 2 && params.identifiers[0] == 'cord_uid') {
		identifiers = { 'cord_uid': params.identifiers[1] }
	}else {
		return { props: { fallback_complete: true } }
	}
	
	const doc = await getDocument(identifiers)
	return {
		props: {
			fallback_complete: true,
			doc
		}
	}
}

export default class DocPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			showFlagModal: false,
			modalKey: 0
			}
		
		this.pageMapping = {}
		pages.forEach(p => {this.pageMapping[p.name] = p.page})
		
		this.closeFlagModal = this.closeFlagModal.bind(this);
		this.showFlagModal = this.showFlagModal.bind(this);
	}
	
	closeFlagModal() {
		this.setState({showFlagModal: false})
	}
	
	showFlagModal() {
		this.setState({showFlagModal: true, modalKey:this.state.modalKey+1 })
	}
	
	render() {
		if(!this.props.fallback_complete)
			return <Layout loading={true}></Layout>
		if (!this.props.doc)
			return <Layout error404={true}></Layout>
		
		var entityGroups = {}
		const entityTypes = [...new Set(this.props.doc.entities.map( e => e.type ))]
		
		entityTypes.forEach( entityType => {
			const entities = this.props.doc.entities.filter( e => e.type==entityType )
			
			var elems;
			if (entityType == 'Virus' || entityType == 'articletype') {
				elems = entities.map( (e,i) => e.name )
			} else if (entityType == 'topic') {
				elems = entities.map( (e,i) => <Link key={'entitylink_'+i} href="/[id]" as={`/${this.pageMapping[e.name]}`}><a>{e.name}</a></Link> )
			} else {
				elems = entities.map( (e,i) => <a key={'entity_'+entityType+'_'+i} href="" onClick={event => event.preventDefault()}>{e.name}</a> )
			}
			
			const combined = elems.length > 0 ? elems.reduce((prev, curr) => [prev, ', ', curr]) : ''
			
			entityGroups[entityType] = combined
		} )
		
		const showEntities = true
		var titleText, abstractText
		if (showEntities) {
			titleText = <TextWithEntities text={this.props.doc.title} entities={this.props.doc.entities} isTitle={true} />
			abstractText = this.props.doc.abstract ? <TextWithEntities text={this.props.doc.abstract} entities={this.props.doc.entities} isTitle={false} /> : <span style={{fontStyle: "italic"}}>No abstract associated with this document</span>
		} else {
			titleText = this.props.doc.title
			abstractText = this.props.doc.abstract
		}
		
		var altmetricBadge = <></>
		if (this.props.doc.altmetric_id != -1) {
			
			const badgeURL = "https://badges.altmetric.com/?size=100&score=" + this.props.doc.altmetric_score + "&types=" + this.props.doc.altmetric_badgetype
			const detailsURL = "http://www.altmetric.com/details.php?citation_id=" + this.props.doc.altmetric_id
			const img = <img src={badgeURL} />
			altmetricBadge = <a href={detailsURL} target="_blank">{img}</a>
		}
		
		const modal = <FlagModal key={'flagmodal_'+this.state.modalKey} doc={this.props.doc} show={this.state.showFlagModal} closeFunc={this.closeFlagModal} />
		
		var publish_date = ''
		if (this.props.doc.publish_year && this.props.doc.publish_month && this.props.doc.publish_day) {
			publish_date = this.props.doc.publish_day.toString() + ' ' + shortMonths[this.props.doc.publish_month] + ' ' + this.props.doc.publish_year.toString()
		} else if (this.props.doc.publish_year && this.props.doc.publish_month) {
			publish_date = shortMonths[this.props.doc.publish_month] + ' ' + this.props.doc.publish_year.toString()
		} else if (this.props.doc.publish_year) {
			publish_date = this.props.doc.publish_year.toString()
		}
		
		return <Layout title={this.props.doc.title}>
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800" style={{width:"80%"}}>
						{titleText}
					</h1>
					<a href={this.props.doc.url} className="d-none d-sm-inline-block btn btn-sm btn-success shadow-sm" target="_blank">
						<span className="text-white-50"><FontAwesomeIcon icon={faExternalLinkAlt} size="sm" /></span> Link
					</a>
				</div>
							

				<div className="card shadow mb-4">
					<div className="card-header py-3">
						<h6 className="m-0 font-weight-bold text-primary">Abstract</h6>
					</div>
					<div className="card-body">
						{abstractText}
					</div>
				</div>
				
				<div className="row">
					<div className="col-lg-7 mb-4">

					  <div className="card shadow mb-4 h-100">
						<div className="card-header py-3">
						  <h6 className="m-0 font-weight-bold text-primary">Metadata</h6>
						</div>
						<div className="card-body">
							
								<div className="row">
									<div className="col-sm-9">
									
									{ publish_date ? <h6>Date: {publish_date}</h6> : "" }
									{ this.props.doc.doi ? <h6>DOI: <a href={"https://doi.org/"+this.props.doc.doi} target="_blank">{this.props.doc.doi}</a></h6> : "" }
									<h6>Journal: {this.props.doc.journal}</h6>
									{ this.props.doc.pubmed_id ? <h6>Pubmed ID: <a href={"https://pubmed.ncbi.nlm.nih.gov/"+this.props.doc.pubmed_id} target="_blank">{this.props.doc.pubmed_id}</a></h6> : "" }
									{ this.props.doc.cord_uid ? <h6><a href="https://www.kaggle.com/allen-institute-for-ai/CORD-19-research-challenge" target="_blank">CORD UID</a>: {this.props.doc.cord_uid}</h6> : "" }
									
									</div>
									<div className="col-sm-3">
										{altmetricBadge}
									</div>
								</div>
						</div>
					  </div>
					</div>
					
					<div className="col-lg-5 mb-4">
						<div className="card shadow mb-4  h-100">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">ML/Curated Information</h6>
							</div>
							<div className="card-body">
								{ 'Virus' in entityGroups ? <h6>Viruses: {entityGroups['Virus']}</h6> : "" }
								{ 'topic' in entityGroups ? <h6>Topics: {entityGroups['topic']}</h6> : "" }
								{ 'articletype' in entityGroups ? <h6>Article Type: {entityGroups['articletype']}</h6> : "" }
								
								<div style={{}}>
									<a href={this.props.doc.url} className="btn btn-sm btn-danger shadow" onClick={event => {this.showFlagModal(); event.preventDefault()}} href="#">
										<span className="text-white-50"><FontAwesomeIcon icon={faExclamationTriangle} size="sm" /></span> Flag Mistake
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>

				{modal}

			</Layout>
	}
}
