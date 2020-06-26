
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

export async function getDocument(document_id) {
	var documents = await db.query(escape`

	SELECT document_id, cord_uid, pubmed_id, title, abstract, url, journal, publish_year, publish_month, publish_day, doi, altmetric_id, altmetric_score, altmetric_score_1day, altmetric_score_1week, altmetric_openaccess, altmetric_badgetype FROM documents d
	WHERE document_id = ${document_id}
	`)
	documents = documents.map(r => Object.assign({entities:[]},r))
	
	if (documents.length == 0)
		return null
	
	const doc = documents[0]
	
	var annotations = await db.query(escape`
	SELECT a.annotation_id, a.document_id, e.name as entity_name, et.name as entitytype_name
	FROM annotations a, entities e, entitytypes et 
	WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id
		AND a.document_id = ${document_id}
	`)
	annotations = annotations.map(r => Object.assign({positions:[]},r))
	
	
	
	var annotationsByID = db.rowsToObject(annotations,'annotation_id')
	
	var annotationpositions = await db.query(escape`
	SELECT ap.annotation_id, ap.in_title, ap.start_pos, ap.end_pos
	FROM annotations a, annotationpositions ap 
	WHERE a.annotation_id = ap.annotation_id
		AND a.document_id = ${document_id}
	`)
	annotationpositions = annotationpositions.map(r => Object.assign({},r))
	
	annotationpositions.forEach(ap => {
		var annotation = annotationsByID[ap.annotation_id]
		var position = { 'in_title': ap.in_title, 'start_pos': ap.start_pos, 'end_pos': ap.end_pos }
		annotation.positions.push(position)
	} )
	
	annotations.map(function(anno) {
		const entity_name = anno.entity_name
		const entity_type = anno.entitytype_name
		const entity_positions = anno.positions
		
		const entity = {name: entity_name, type: entity_type, positions: entity_positions}
		doc.entities.push(entity)
	})
	
	return doc
}
