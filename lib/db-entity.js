
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

async function getCoordinates(entity_id) {
	var coordinates = await db.query(escape`

	SELECT c.longitude, c.latitude FROM coordinates c WHERE c.entity_id = ${entity_id}
	
	`)
	coordinates = coordinates.map(r => Object.assign({},r))
	return coordinates[0]
}

export async function getEntity(entity_type,entity_name) {
	var sql = escape`

	SELECT e.entity_id, e.name as entity_name, et.name as entity_type, e.external_id FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id
	AND e.name = ${entity_name}
	AND et.name = ${entity_type}
	
	`
	
	console.log(sql)
	
	var entities = await db.query(escape`

	SELECT e.entity_id, e.name as entity_name, et.name as entity_type, e.external_id FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id
	AND e.name = ${entity_name}
	AND et.name = ${entity_type}
	
	`)
	entities = entities.map(r => Object.assign({},r))
	
	if (entities.length == 0)
		return null
	
	var entity = entities[0]
	if (entity.entity_type == 'Location') {
		const coords = await getCoordinates(entity.entity_id)
		entity.longitude = coords.longitude
		entity.latitude = coords.latitude
	}
	
	return entity
}

export async function getPapersWithEntity(entity_id) {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.doi, d.is_preprint, d.publish_year, d.publish_month, d.publish_day, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype
	FROM documents d, annotations a 
	WHERE d.document_id = a.document_id
		AND a.entity_id = ${entity_id}
	ORDER BY d.publish_year DESC
	`)
	documents = documents.map(r => Object.assign({},r))
	
	var documentsByID = db.rowsToObject(documents,'document_id')
	
	Object.keys(documentsByID).forEach( document_id => {
		const doc = documentsByID[document_id]
		const publish_year = doc.publish_year ? doc.publish_year : 2000
		const publish_month = doc.publish_month ? doc.publish_month-1 : 0
		const publish_day = doc.publish_day ? doc.publish_day : 1
		doc['publish_timestamp'] = (new Date(publish_year, publish_month, publish_day)).valueOf()
		
		doc['is_preprint'] = doc['is_preprint'] ? 'Preprint' : 'Not preprint'
	})
	
	var annotations = await db.query(escape`
	SELECT a1.document_id, e.name as entity_name, et.name as entitytype_name
	FROM annotations a1, annotations a2, entities e, entitytypes et 
	WHERE a1.entity_id = e.entity_id
		AND a2.entity_id = ${entity_id}
		AND a1.document_id = a2.document_id
		AND e.entitytype_id = et.entitytype_id
	`)
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

/*export async function getEntityCounts(entitytype) {
	var counts = await db.query(escape`

	SELECT name as entity_name, COUNT(*) as count FROM
		(SELECT e.name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.name = ${entitytype}
			) as tmp1 
	GROUP BY entity_name
	ORDER BY count DESC
	LIMIT 30

	`)
	
	counts = counts.map(r => Object.assign({},r))
	
	return counts
}*/

export async function getEntityCountsByVirus(entitytype) {
	var dbResponse = await db.query(escape`

	SELECT tmp1.name as entity_name,tmp2.name as virus_name,COUNT(*) as count 
	FROM (
		SELECT a.document_id, e.name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.name = ${entitytype}) as tmp1
	JOIN (
		SELECT a.document_id, e.name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.name = 'Virus'
	) as tmp2
	ON tmp1.document_id = tmp2.document_id
	GROUP BY tmp1.name,tmp2.name

	`)
	dbResponse = dbResponse.map(row => Object.assign({},row))
	
	const viruses = ['MERS-CoV','SARS-CoV','SARS-CoV-2']
	
	var data = {}
	
	dbResponse.forEach( row => {
		const v = row['virus_name']
		const entity_name = row['entity_name']
		const count = row['count']
		
		if (! (entity_name in data)) {
			data[entity_name] = {'name':entity_name,'MERS-CoV':0,'SARS-CoV':0,'SARS-CoV-2':0}
		}
		
		data[entity_name][v] = count
	})
	
	const result = Object.values(data)
	
	return result
}