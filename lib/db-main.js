
import pages from '../lib/pages.json'

const db = require('./db')
const escape = require('sql-template-strings')

export async function getEntityID(entityName,entityType) {
	var entities = await db.query(escape`

	SELECT e.entity_id
	FROM entities e, entitytypes et 
	WHERE e.name = ${entityName}
	AND et.name = ${entityType}
	AND e.entitytype_id = et.entitytype_id

	`)
	entities = entities.map(r => Object.assign({},r))
	if (entities.length == 1)
		return entities[0].entity_id
	else
		return -1
}

export async function getEntityTypeID(entityType) {
	var entities = await db.query(escape`

	SELECT et.entitytype_id
	FROM entitytypes et 
	WHERE et.name = ${entityType}

	`)
	entitytypes = entitytypes.map(r => Object.assign({},r))
	if (entitytypes.length == 1)
		return entitytypes[0].entitytype_id
	else
		return -1
}

async function getResearchByTopic_partialSQL(topic) {
	const topicID = await getEntityID(topic,'topic')
	const researchID = await getEntityID('Research','articletype')
	
	return `

	FROM documents d, annotations anno_topic, annotations anno_articletype 
	WHERE d.document_id = anno_topic.document_id 
	AND d.document_id = anno_articletype.document_id 
	AND anno_articletype.document_id 
	AND anno_topic.entity_id = ${topicID} 
	AND anno_articletype.entity_id = ${researchID}

	`
}

async function getByTopic_partialSQL(topic) {
	const topicID = await getEntityID(topic,'topic')
	
	return `

	FROM documents d, annotations anno_topic 
	WHERE d.document_id = anno_topic.document_id 
	AND anno_topic.document_id 
	AND anno_topic.entity_id = ${topicID}
	
	`
}

async function getByArticleType_partialSQL(articletype) {
	const articletypeID = await getEntityID(articletype,'articletype')
	
	return `

	FROM documents d, annotations anno_articletype 
	WHERE d.document_id = anno_articletype.document_id 
	AND anno_articletype.document_id 
	AND anno_articletype.entity_id = ${articletypeID}
	
	`
}

async function getDocumentsWithPartialSQL(partialSQL) {
	const selectSQL = "SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.publish_month, d.publish_day, d.doi, d.is_preprint, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype, d.annotations_json " + partialSQL
	
	var documents = await db.query(selectSQL)
	documents = documents.map(r => Object.assign({},r))
	return documents
}

export async function getTableData(page_info) {
	const isArticleType = 'is_articletype' in page_info && page_info['is_articletype']
	const dbTopicName = 'altname' in page_info ? page_info.altname : page_info.name
	
	var partialSQL
	if (isArticleType) {
		partialSQL = await getByArticleType_partialSQL(dbTopicName)
	} else {
		partialSQL = await getResearchByTopic_partialSQL(dbTopicName)
	}
	
	var documents = await getDocumentsWithPartialSQL(partialSQL)
		
	var documentsByID = db.rowsToObject(documents,'document_id')
	
	Object.keys(documentsByID).forEach( document_id => {
		const doc = documentsByID[document_id]
		const publish_year = doc.publish_year ? doc.publish_year : 2000
		const publish_month = doc.publish_month ? doc.publish_month-1 : 0
		const publish_day = doc.publish_day ? doc.publish_day : 1
		doc['publish_timestamp'] = (new Date(publish_year, publish_month, publish_day, 12, 0, 0)).valueOf()
				
		doc['is_preprint'] = doc['is_preprint'] ? 'Preprint' : 'Not preprint'
		
		doc['entities'] = JSON.parse(doc['annotations_json'])
		doc['entities'].forEach( e => { delete e.positions} )
		delete doc.annotations_json
	})
	
	return Object.values(documentsByID)
}


export async function getChartData(category,entitytype) {
	var counts = await db.query(escape`

	SELECT name as entity_name, COUNT(*) as count FROM
		(SELECT e.name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.name = ${entitytype}
			AND a.document_id IN (
				SELECT a.document_id 
				FROM annotations a, entities e, entitytypes et 
				WHERE e.name = ${category}
					AND a.entity_id = e.entity_id 
					AND e.entitytype_id = et.entitytype_id 
					AND (et.name = 'topic' OR et.name = 'articletype')
			)) as tmp1 
	GROUP BY entity_name
	ORDER BY count DESC
	LIMIT 30

	`)
	
	counts = counts.map(r => Object.assign({},r))
	
	return counts
}

export async function getChartDataByVirusInCategory(category,entitytype,topLimit) {
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
	WHERE tmp1.document_id IN (
		SELECT a.document_id
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND (et.name = 'topic' OR et.name = 'articletype')
		AND e.name = ${getChartDataByVirusInTopic}
	)
	GROUP BY tmp1.name,tmp2.name

	`)
	dbResponse = dbResponse.map(row => Object.assign({},row))
	
	const virusCombinations = ['MERS-CoV','SARS-CoV','SARS-CoV-2','MERS-CoV,SARS-CoV','MERS-CoV,SARS-CoV-2','SARS-CoV,SARS-CoV-2','MERS-CoV,SARS-CoV,SARS-CoV-2']
	
	var dataForAllCombos = {}
	virusCombinations.forEach( virusCombo => {
		
		const viruses = virusCombo.split(',')
	
		const counts = dbResponse.filter(row => viruses.includes(row['virus_name']))
		
		const countsEntityOnly = counts.reduce(function(p, row) {
			var name = row['entity_name']
			var count = row['count']
			p[name] = (p[name] || 0) + count;
			return p;
		}, {});
		
		//const topLimit = 30
		const topEntities = Object.keys(countsEntityOnly).map( k=> [countsEntityOnly[k],k] ).sort( (a,b) => b[0]-a[0] ).slice(0,topLimit).map(x => x[1])
		
		
		const topCounts = counts.filter(row => topEntities.includes(row['entity_name']))
		
		const virusAndEntityMap = viruses.map( v => 
			topCounts.filter(row => row['virus_name'] == v).reduce(function(prev,curr){prev[curr['entity_name']]=curr['count'];return prev;},{}))
		
		const datasets = viruses.map( (v,i) => { return { 'label': v, 'data': topEntities.map(e => ((e in virusAndEntityMap[i]) ? virusAndEntityMap[i][e] : 0) ) } } )
			
		dataForAllCombos[virusCombo] = {labels:topEntities, datasets: datasets}
		
	})
	
	dataForAllCombos[''] = dataForAllCombos['MERS-CoV,SARS-CoV,SARS-CoV-2']
	
	return dataForAllCombos
}