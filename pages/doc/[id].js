import React, { Component } from 'react';
import Link from 'next/link'
import Layout from '../../components/Layout.js'
import TextWithEntities from '../../components/TextWithEntities.js'
import Button from 'react-bootstrap/Button'

import { getAllDocumentIDs } from '../../lib/db-doc.js'
import { getDocument } from '../../lib/db-doc.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

export async function getStaticPaths() {
	// A workaround for NextJS error (below)
	// Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
	const isDevelopment = (process.env.NODE_ENV == 'development')
	const documents = isDevelopment ? await getAllDocumentIDs() : []
	
	const paths = documents.map(function(d) {
		return { params: {id: d.document_id.toString()} }
	} )
	
	return {
		paths,
		fallback: true
	}
}

export async function getStaticProps({ params }) {
	const doc = await getDocument(params.id)
	return {
		props: {
			doc
		}
	}
}

export default class DocPage extends Component {
	constructor(props) {
		super(props)
	}
	
	render() {
		if (!this.props.doc)
			return <div></div>
		
		var entityGroups = {}
		const entityTypes = [...new Set(this.props.doc.entities.map( e => e.type ))]
		
		entityTypes.forEach( entityType => {
			const entities = this.props.doc.entities.filter( e => e.type==entityType )
			
			const elems = entities.map( (e,i) => <a key={'entity_'+entityType+'_'+i} href="" onClick={event => event.preventDefault()}>{e.name}</a> )
			
			const combined = elems.length > 0 ? elems.reduce((prev, curr) => [prev, ', ', curr]) : ''
			
			entityGroups[entityType] = combined
		} )
		
		console.log(this.props.doc)
		
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
							
							<div className="container">
								<div className="row">
									<div className="col">
									
									{ this.props.doc.doi ? <h6>DOI: <a href={"https://doi.org/"+this.props.doc.doi} target="_blank">{this.props.doc.doi}</a></h6> : "" }
									<h6>Journal: {this.props.doc.journal}</h6>
									{ this.props.doc.pubmed_id ? <h6>Pubmed ID: <a href={"https://pubmed.ncbi.nlm.nih.gov/"+this.props.doc.pubmed_id} target="_blank">{this.props.doc.pubmed_id}</a></h6> : "" }
									{ this.props.doc.cord_uid ? <h6><a href="https://www.kaggle.com/allen-institute-for-ai/CORD-19-research-challenge" target="_blank">CORD UID</a>: {this.props.doc.cord_uid}</h6> : "" }
									
									</div>
									<div className="col-3">
									{altmetricBadge}
									</div>
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
								{ 'virus' in entityGroups ? <h6>Viruses: {entityGroups['virus']}</h6> : "" }
								{ 'topic' in entityGroups ? <h6>Topics: {entityGroups['topic']}</h6> : "" }
								{ 'pubtype' in entityGroups ? <h6>Publication Type: {entityGroups['pubtype']}</h6> : "" }
							</div>
						</div>
					</div>
				</div>


			</Layout>
	}
}
