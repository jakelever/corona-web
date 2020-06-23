
const db = require('../lib/db')
const escape = require('sql-template-strings')

async function getResearchPapers(topic) {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.doi FROM documents d
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
	ORDER BY d.publish_year DESC

	`)
	documents = documents.map(r => Object.assign({},r))
	return documents
}

async function getReviewPapers() {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.doi FROM documents d
	JOIN
	(SELECT a.document_id
	FROM annotations a, entities e, entitytypes et 
	WHERE e.entity_name = 'Review' 
		AND et.entitytype_name = 'pubtype' 
		AND e.entity_id = a.entity_id 
		AND e.entitytype_id = et.entitytype_id) as tmp
	ON d.document_id = tmp.document_id
	ORDER BY d.publish_year DESC
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


export async function getChartData(topic,entitytype) {
	var counts = await db.query(escape`

	SELECT entity_name, COUNT(*) as count FROM
		(SELECT e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.entitytype_name = ${entitytype}
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

export async function getChartDataByVirus(topic,entitytype,selected_viruses) {
	const dbResponse = await db.query(escape`

	SELECT tmp1.entity_name as entity_name,tmp2.entity_name as virus_name,COUNT(*) as count 
	FROM (
		SELECT a.document_id, e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = ${entitytype}) as tmp1
	JOIN (
		SELECT a.document_id, e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'virus'    
	) as tmp2
	ON tmp1.document_id = tmp2.document_id
	WHERE tmp1.document_id IN (
		SELECT a.document_id
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'topic'
		AND e.entity_name = ${topic}
	)
	GROUP BY tmp1.entity_name,tmp2.entity_name

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