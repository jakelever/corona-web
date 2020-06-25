
const db = require('./db')
const escape = require('sql-template-strings')

export async function getTrendingDocuments() {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.doi, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype
	FROM documents d
	WHERE d.altmetric_score_1day >= 100
	ORDER BY d.publish_year DESC
	`)
	documents = documents.map(r => Object.assign({},r))
	
	var documentsByID = db.rowsToObject(documents,'document_id')
	
	var annotations = await db.query(escape`
	SELECT a.document_id, e.name as entity_name, et.name as entitytype_name
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
		
		const entity = {name: entity_name, type: entity_type}
		doc.entities.push(entity)
	})
	
	return Object.values(documentsByID)
}