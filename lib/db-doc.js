
const db = require('../lib/db')
const escape = require('sql-template-strings')

export async function getAllDocumentIDs() {
	var documents = await db.query(escape`

	SELECT document_id FROM documents
	ORDER BY document_id DESC
	`)
	documents = documents.map(r => Object.assign({},r))
	return documents
}

export async function getDocument(identifiers) {
	var doc_select_sql = 'SELECT document_id, cord_uid, pubmed_id, title, abstract, url, journal, publish_year, publish_month, publish_day, doi, altmetric_id, altmetric_score, altmetric_score_1day, altmetric_score_1week, altmetric_openaccess, altmetric_badgetype, annotations_json FROM documents d '
	
	if ('document_id' in identifiers) {
		doc_select_sql = escape``.append(doc_select_sql).append(escape`WHERE document_id = ${identifiers.document_id}`)
	} else if ('doi' in identifiers) {
		doc_select_sql = escape``.append(doc_select_sql).append(escape`WHERE doi = ${identifiers.doi}`)
	} else if ('pubmed_id' in identifiers) {
		doc_select_sql = escape``.append(doc_select_sql).append(escape`WHERE pubmed_id = ${identifiers.pubmed_id}`)
	} else if ('cord_uid' in identifiers) {
		doc_select_sql = escape``.append(doc_select_sql).append(escape`WHERE cord_uid = ${identifiers.cord_uid}`)
	} else if ('url' in identifiers) {
		const url_noslashes = identifiers.url.replace(/\//g,'')
		doc_select_sql = escape``.append(doc_select_sql).append(escape`WHERE REPLACE(url,'/','') = ${url_noslashes}`)
	} else {
		return null
	}
		
	var documents = await db.query(doc_select_sql)
	documents = documents.map(r => Object.assign({entities:[]},r))
	
	if (documents.length == 0)
		return null
	
	const doc = documents[0]
	
	doc['entities'] = JSON.parse(doc['annotations_json'])
	delete doc.annotations_json
	
	const document_id = doc.document_id
	
	return doc
}
