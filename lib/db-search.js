
const db = require('../lib/db')
const escape = require('sql-template-strings')

export async function searchEntities(query) {
	//console.log(query)
	const queryWithPercents = '%' + query + '%'
	var entities = await db.query(escape`

	SELECT e.entity_id,e.name as entity_name,et.name as entity_type
	FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id
	AND e.name LIKE ${queryWithPercents}
	LIMIT 6
	`)
	entities = entities.map(r => Object.assign({},r))
	return entities
}

export async function searchDocuments(query) {
	//console.log(query)
	const queryWithPercents = '%' + query + '%'
	var documents = await db.query(escape`

	SELECT d.title, d.doi, d.pubmed_id, d.cord_uid, d.url
	FROM documents d
	WHERE d.title LIKE ${queryWithPercents}
	LIMIT 3
	`)
	documents = documents.map(r => Object.assign({},r))
	return documents
}

export async function searchTitleAbstracts(query) {
	//console.log(query)
	const queryWithPercents = '%' + query + '%'
	
	const partialSQL = escape`FROM documents d WHERE d.title LIKE ${queryWithPercents}  OR d.abstract LIKE ${queryWithPercents}`

	const selectSQL = escape`SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.publish_month, d.publish_day, d.doi, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype `.append(partialSQL)
	
	var documents = await db.query(selectSQL)
	documents = documents.map(r => Object.assign({},r))

	var documentsByID = db.rowsToObject(documents,'document_id')
	
	Object.keys(documentsByID).forEach( document_id => {
		const doc = documentsByID[document_id]
		const publish_year = doc.publish_year ? doc.publish_year : 2000
		const publish_month = doc.publish_month ? doc.publish_month-1 : 0
		const publish_day = doc.publish_day ? doc.publish_day : 1
		doc['publish_timestamp'] = (new Date(publish_year, publish_month, publish_day)).valueOf()
	})
	
	const annotationSQL = escape`
	SELECT a.document_id, e.name as entity_name, et.name as entitytype_name
	FROM annotations a, entities e, entitytypes et 
	WHERE a.entity_id = e.entity_id 
	AND e.entitytype_id = et.entitytype_id
	AND a.document_id IN (SELECT d.document_id `.append(partialSQL).append(`)`)
	
	var annotations = await db.query(annotationSQL)
	annotations = annotations.map(r => Object.assign({},r))
	
	annotations.map(function(anno) {
		if (! (anno.document_id in documentsByID) )
			return false
		
		var doc = documentsByID[anno.document_id]
		const entity_name = anno.entity_name
		const entity_type = anno.entitytype_name
		
		if (entity_name == 'Research' && entity_type == 'category')
			return
		
		const entity = {name: entity_name, type: entity_type}
		doc.entities.push(entity)
	})
	
	return Object.values(documentsByID)

}