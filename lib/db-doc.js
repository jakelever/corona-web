
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
	var doc_select_sql = 'SELECT document_id, cord_uid, pubmed_id, title, abstract, url, journal, publish_year, publish_month, publish_day, doi, altmetric_id, altmetric_score, altmetric_score_1day, altmetric_score_1week, altmetric_openaccess, altmetric_badgetype FROM documents d '
	
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
	
	const document_id = doc.document_id
	
	var annotations = await db.query(escape`
	SELECT a.annotation_id, a.document_id, e.name as entity_name, et.name as entitytype_name
	FROM annotations a, entities e, entitytypes et 
	WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id
		AND a.document_id = ${document_id}
	`)
	annotations = annotations.map(r => Object.assign({positions:[]},r))
	
	
	
	var annotationsByID = db.rowsToObject(annotations,'annotation_id')
	
	var annotationspans = await db.query(escape`
	SELECT ap.annotation_id, ap.in_title, ap.start_pos, ap.end_pos
	FROM annotations a, annotationspans ap 
	WHERE a.annotation_id = ap.annotation_id
		AND a.document_id = ${document_id}
	`)
	annotationspans = annotationspans.map(r => Object.assign({},r))
	
	annotationspans.forEach(ap => {
		var annotation = annotationsByID[ap.annotation_id]
		var position = { 'in_title': ap.in_title, 'start_pos': ap.start_pos, 'end_pos': ap.end_pos }
		annotation.positions.push(position)
	} )
	
	annotations.map(function(anno) {
		const entity_name = anno.entity_name
		const entity_type = anno.entitytype_name
		const entity_positions = anno.positions
		
		if (entity_name == 'Research' && entity_type == 'category')
			return
		
		const entity = {name: entity_name, type: entity_type, positions: entity_positions}
		doc.entities.push(entity)
	})
	
	return doc
}
