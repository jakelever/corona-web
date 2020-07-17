
const db = require('./db')
const escape = require('sql-template-strings')

async function getEntityID(entityName,entityType) {
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

async function getResearchPapers_partialSQL(topic) {
	const topicID = await getEntityID(topic,'topic')
	const researchID = await getEntityID('Research','pubtype')
	
	return `

	FROM documents d, annotations anno_topic, annotations anno_pubtype 
	WHERE d.document_id = anno_topic.document_id 
	AND d.document_id = anno_pubtype.document_id 
	AND anno_pubtype.document_id 
	AND anno_topic.entity_id = ${topicID} 
	AND anno_pubtype.entity_id = ${researchID}
	

	`
}

async function getPapersByPubType_partialSQL(pubtype) {
	const reviewID = await getEntityID(pubtype,'pubtype')
	
	return `

	FROM documents d, annotations anno_pubtype 
	WHERE d.document_id = anno_pubtype.document_id 
	AND anno_pubtype.document_id 
	AND anno_pubtype.entity_id = ${reviewID}
	
	`
}

async function getDocumentsWithPartialSQL(partialSQL) {
	const selectSQL = "SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.publish_month, d.publish_day, d.doi, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype " + partialSQL
	
	var documents = await db.query(selectSQL)
	documents = documents.map(r => Object.assign({},r))
	return documents
}

export async function getTableData(pagename) {
	var partialSQL
	if (pagename == 'Reviews') {
		partialSQL = await(getPapersByPubType_partialSQL('Review'))
	} else if (pagename == 'Comments & Editorials') {
		partialSQL = await(getPapersByPubType_partialSQL('Comment/Editorial'))
	} else if (pagename == 'Updates') {
		partialSQL = await(getPapersByPubType_partialSQL('Updates'))
	} else {
		partialSQL = await getResearchPapers_partialSQL(pagename)
	}
	
	var documents = await getDocumentsWithPartialSQL(partialSQL)
		
	var documentsByID = db.rowsToObject(documents,'document_id')
	
	const annotationSQL = `
	SELECT a.document_id, e.name as entity_name, et.name as entitytype_name
	FROM annotations a, entities e, entitytypes et 
	WHERE a.entity_id = e.entity_id 
	AND e.entitytype_id = et.entitytype_id
	AND a.document_id IN (SELECT d.document_id ` + partialSQL + `)`
	
	var annotations = await db.query(annotationSQL)
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


export async function getChartData(topic,entitytype) {
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
				WHERE e.name = ${topic}
					AND a.entity_id = e.entity_id 
					AND e.entitytype_id = et.entitytype_id 
					AND et.name = 'topic'
			)) as tmp1 
	GROUP BY entity_name
	ORDER BY count DESC
	LIMIT 30

	`)
	
	counts = counts.map(r => Object.assign({},r))
	
	return counts
}

export async function getChartDataByVirus(topic,entitytype,selected_viruses) {
	const dbResponse = await db.query(escape`

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
		AND et.name = 'virus'    
	) as tmp2
	ON tmp1.document_id = tmp2.document_id
	WHERE tmp1.document_id IN (
		SELECT a.document_id
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.name = 'topic'
		AND e.name = ${topic}
	)
	GROUP BY tmp1.name,tmp2.name

	`)
	
	const viruses = (typeof selected_viruses === 'undefined') ? ['SARS-CoV-2','MERS-CoV','SARS-CoV'] : selected_viruses
	
	const counts = dbResponse.map(row => Object.assign({},row)).filter(row => viruses.includes(row['virus_name']))
	
	const countsEntityOnly = counts.reduce(function(p, row) {
		var name = row['entity_name']
		var count = row['count']
		p[name] = (p[name] || 0) + count;
		return p;
	}, {});
	
	const topLimit = 30
	const topEntities = Object.keys(countsEntityOnly).map( k=> [countsEntityOnly[k],k] ).sort( (a,b) => b[0]-a[0] ).slice(0,topLimit).map(x => x[1])
	
	
	const topCounts = counts.filter(row => topEntities.includes(row['entity_name']))
	
	const virusAndEntityMap = viruses.map( v => 
		topCounts.filter(row => row['virus_name'] == v).reduce(function(prev,curr){prev[curr['entity_name']]=curr['count'];return prev;},{}))
	
	const datasets = viruses.map( (v,i) => { return { 'label': v, 'data': topEntities.map(e => ((e in virusAndEntityMap[i]) ? virusAndEntityMap[i][e] : 0) ) } } )
		
	const finalData = {labels:topEntities, datasets: datasets}
	
	return finalData
}