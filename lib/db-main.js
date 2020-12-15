
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

async function getResearchByCategory_partialSQL(category) {
	const categoryID = await getEntityID(category,'category')
	const researchID = await getEntityID('Research','category')
	//const metaanalysisID = await getEntityID('Meta-analysis','category')
	
	return `

	FROM documents d, annotations anno_category, annotations anno_articletype 
	WHERE d.document_id = anno_category.document_id 
	AND d.document_id = anno_articletype.document_id 
	AND anno_articletype.document_id 
	AND anno_category.entity_id = ${categoryID} 
	AND anno_articletype.entity_id = ${researchID}

	`
}

async function getByCategory_partialSQL(category) {
	const categoryID = await getEntityID(category,'category')
	
	return `

	FROM documents d, annotations anno_articletype 
	WHERE d.document_id = anno_articletype.document_id 
	AND anno_articletype.document_id 
	AND anno_articletype.entity_id = ${categoryID}
	
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
		partialSQL = await(getByCategory_partialSQL('Review'))
	} else if (pagename == 'Comments & Editorials') {
		partialSQL = await(getByCategory_partialSQL('Comment/Editorial'))
	} else if (pagename == 'Updates') {
		partialSQL = await(getByCategory_partialSQL('Updates'))
	} else if (pagename == 'Book Chapters') {
		partialSQL = await(getByCategory_partialSQL('Book chapter'))
	} else if (pagename == 'Medical Specialties') {
		partialSQL = await(getResearchByCategory_partialSQL('Effect on Medical Specialties'))
	} else if (pagename == 'News') {
		partialSQL = await(getByCategory_partialSQL('News'))
	} else if (pagename == 'Retractions') {
		partialSQL = await(getByCategory_partialSQL('Retracted'))
	} else if (pagename == 'CDC Weekly Reports') {
		partialSQL = await(getByCategory_partialSQL('CDC Weekly Report'))
	} else {
		partialSQL = await getResearchByCategory_partialSQL(pagename)
	}
	
	var documents = await getDocumentsWithPartialSQL(partialSQL)
		
	var documentsByID = db.rowsToObject(documents,'document_id')
	
	Object.keys(documentsByID).forEach( document_id => {
		const doc = documentsByID[document_id]
		const publish_year = doc.publish_year ? doc.publish_year : 2000
		const publish_month = doc.publish_month ? doc.publish_month-1 : 0
		const publish_day = doc.publish_day ? doc.publish_day : 1
		doc['publish_timestamp'] = (new Date(publish_year, publish_month, publish_day)).valueOf()
	})
	
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
		
		if (entity_name == 'Research' && entity_type == 'category')
			return
		
		const entity = {name: entity_name, type: entity_type}
			
		doc.entities.push(entity)
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
					AND et.name = 'category'
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
		AND et.name = 'category'
		AND e.name = ${category}
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