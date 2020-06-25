
const db = require('./db')
const escape = require('sql-template-strings')

export async function getAllEntities() {
	var entities = await db.query(escape`

	SELECT e.entity_id, e.name as entity_name, et.name as entity_type FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id

	`)
	entities = entities.map(r => Object.assign({},r))
	return entities
}

export async function getEntity(entity_type,entity_name) {
	var entities = await db.query(escape`

	SELECT e.entity_id, e.name as entity_name, et.name as entity_type, e.external_id FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id
	AND e.name = ${entity_name}
	AND et.name = ${entity_type}

	`)
	entities = entities.map(r => Object.assign({},r))
	return entities[0]
}

export async function getPapersWithEntity(entity_id) {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.doi, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype
	FROM documents d, annotations a 
	WHERE d.document_id = a.document_id
		AND a.entity_id = ${entity_id}
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