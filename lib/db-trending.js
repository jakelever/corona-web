
const db = require('./db')
const escape = require('sql-template-strings')

export async function getTrendingDocuments() {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.publish_month, d.publish_day, d.doi, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype
	FROM documents d
	WHERE d.altmetric_score_1day >= 10
	AND d.publish_year != ''
	AND d.publish_month != ''
	AND d.publish_day != ''
	AND DATEDIFF(CURDATE(), CONCAT_WS("-",d.publish_year,d.publish_month,d.publish_day)) <= 14
	`)
	documents = documents.map(r => Object.assign({},r))
	
	var documentsByID = db.rowsToObject(documents,'document_id')
	
	Object.keys(documentsByID).forEach( document_id => {
		const doc = documentsByID[document_id]
		const publish_year = doc.publish_year ? doc.publish_year : 2000
		const publish_month = doc.publish_month ? doc.publish_month-1 : 0
		const publish_day = doc.publish_day ? doc.publish_day : 1
		doc['publish_timestamp'] = (new Date(publish_year, publish_month, publish_day)).valueOf()
	})
	
	var annotations = await db.query(escape`
	SELECT d.document_id, e.name as entity_name, et.name as entitytype_name
	FROM documents d, annotations a, entities e, entitytypes et 
	WHERE d.document_id = a.document_id
		AND d.altmetric_score_1day >= 10
		AND a.entity_id = e.entity_id 
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