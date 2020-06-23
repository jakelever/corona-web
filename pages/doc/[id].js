import React, { Component } from 'react';
import Link from 'next/link'
import Layout from '../../components/Layout.js'

import { getAllDocumentIDs, getDocument } from '../../lib/db-doc.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

export async function getStaticPaths() {
	const documents = await getAllDocumentIDs()
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
		
		return <Layout title={this.props.doc.title + ' | CoronaHub'} page={null} updateVirus={null}>
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800" style={{width:"80%"}}>{this.props.doc.title}</h1>
					<a href={this.props.doc.url} className="d-none d-sm-inline-block btn btn-sm btn-success shadow-sm" target="_blank">
						<span className="text-white-50"><FontAwesomeIcon icon={faExternalLinkAlt} size="sm" /></span> Link
					</a>
				</div>
							

				<div className="card shadow mb-4">
					<div className="card-header py-3">
						<h6 className="m-0 font-weight-bold text-primary">Abstract</h6>
					</div>
					<div className="card-body">
						{this.props.doc.abstract}
					</div>
				</div>
				
				<div className="card shadow mb-4">
					<div className="card-header py-3">
						<h6 className="m-0 font-weight-bold text-primary">Metadata</h6>
					</div>
					<div className="card-body">
						{ this.props.doc.doi ? <h6>DOI: <a href={"https://doi.org/"+this.props.doc.doi} target="_blank">{this.props.doc.doi}</a></h6> : "" }
						<h6>Journal: {this.props.doc.journal}</h6>
						{ this.props.doc.pubmed_id ? <h6>Pubmed ID: <a href={"https://pubmed.ncbi.nlm.nih.gov/"+this.props.doc.pubmed_id} target="_blank">{this.props.doc.pubmed_id}</a></h6> : "" }
						{ this.props.doc.cord_uid ? <h6><a href="https://www.kaggle.com/allen-institute-for-ai/CORD-19-research-challenge" target="_blank">CORD UID</a>: {this.props.doc.cord_uid}</h6> : "" }
					</div>
				</div>

			</Layout>
	}
}
