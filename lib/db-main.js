
//import fetch from 'isomorphic-unfetch'
const db = require('../lib/db')
const escape = require('sql-template-strings')

async function getResearchPapers(topic) {
	var documents = await db.query(escape`

	SELECT d.document_id, d.title, d.url, d.journal, d.publish_year, d.doi FROM documents d
	JOIN
	(SELECT a.document_id
	FROM annotations a, entities e, entitytypes et 
	WHERE e.entity_name = ${topic} 
		AND et.entitytype_name = 'topic' 
		AND e.entity_id = a.entity_id 
		AND e.entitytype_id = et.entitytype_id) as tmp
	ON d.document_id = tmp.document_id
	WHERE d.document_id IN (
		SELECT a.document_id
		FROM annotations a, entities e, entitytypes et 
		WHERE e.entity_name = 'Research'
		AND et.entitytype_name = 'pubtype' 
		AND e.entity_id = a.entity_id 
		AND e.entitytype_id = et.entitytype_id)

	`)
	documents = documents.map(r => Object.assign({},r))
	return documents
}

async function getReviewPapers() {
	var documents = await db.query(escape`

	SELECT d.document_id, d.title, d.url, d.journal, d.publish_year, d.doi FROM documents d
	JOIN
	(SELECT a.document_id
	FROM annotations a, entities e, entitytypes et 
	WHERE e.entity_name = 'Review' 
		AND et.entitytype_name = 'pubtype' 
		AND e.entity_id = a.entity_id 
		AND e.entitytype_id = et.entitytype_id) as tmp
	ON d.document_id = tmp.document_id

	`)
	documents = documents.map(r => Object.assign({},r))
	return documents
}

export async function getTableData(pagename) {
	var documents //= await getResearchPapers(pagename)
	if (pagename == 'Reviews') {
		documents = await getReviewPapers()
	} else {
		documents = await getResearchPapers(pagename)
	}
	
	/*var documents = await db.query(escape`

	SELECT d.document_id, d.title, d.url, d.journal, d.publish_year, d.doi FROM documents d
	JOIN
	(SELECT a.document_id
	FROM annotations a, entities e, entitytypes et 
	WHERE e.entity_name = ${topic} 
		AND et.entitytype_name = 'topic' 
		AND e.entity_id = a.entity_id 
		AND e.entitytype_id = et.entitytype_id) as tmp
	ON d.document_id = tmp.document_id
	WHERE d.document_id IN (
		SELECT a.document_id
		FROM annotations a, entities e, entitytypes et 
		WHERE e.entity_name = 'Research'
		AND et.entitytype_name = 'pubtype' 
		AND e.entity_id = a.entity_id 
		AND e.entitytype_id = et.entitytype_id)

	`)
	documents = documents.map(r => Object.assign({},r))*/
	
	const documentToObject = (array) =>
		array.reduce((obj, item) => {
			item.entities = []
			obj[item.document_id] = item
			return obj
		}, {})
	
	var documentsByID = documentToObject(documents)
	
	var annotations = await db.query(escape`
	SELECT a.document_id, e.entity_name, et.entitytype_name 
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


export async function getChartData(topic) {
	var counts = await db.query(escape`

	SELECT entity_name, COUNT(*) as count FROM
		(SELECT e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.entitytype_name = 'drug'
			AND a.document_id IN (
				SELECT a.document_id 
				FROM annotations a, entities e, entitytypes et 
				WHERE e.entity_name = ${topic}
					AND a.entity_id = e.entity_id 
					AND e.entitytype_id = et.entitytype_id 
					AND et.entitytype_name = 'topic'
			)) as tmp1 
	GROUP BY entity_name
	ORDER BY count DESC
	LIMIT 30

	`)
	
	counts = counts.map(r => Object.assign({},r))
	
	return counts
}

