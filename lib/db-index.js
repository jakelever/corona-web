

const db = require('../lib/db')
const escape = require('sql-template-strings')

import pages from '../lib/pages.json'

import { getEntityID } from './db-main'

export async function getPopularLocations(limit) {
	var counts = await db.query(escape`

	SELECT * FROM
		(SELECT e_loc.entity_id as location_id, e_loc.name as name, e_virus.name as virus, c.longitude, c.latitude, COUNT(*) as count
		FROM annotations anno_loc, entities e_loc, coordinates c, annotations anno_virus, entities e_virus, entitytypes et_virus
		WHERE anno_loc.entity_id = e_loc.entity_id
		AND e_loc.entity_id = c.entity_id
		AND anno_loc.document_id = anno_virus.document_id
		AND anno_virus.entity_id = e_virus.entity_id
		AND e_virus.entitytype_id = et_virus.entitytype_id
		AND et_virus.name = 'Virus'
		GROUP BY name, virus, c.longitude, c.latitude) as tmp
	WHERE tmp.count > 5

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}

export async function getJournalCounts(limit) {
	var counts = await db.query(escape`

	SELECT journal as name, COUNT(*) as count
	FROM documents
	WHERE journal != ''
	GROUP BY journal
	ORDER BY count DESC
	LIMIT ${limit}

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}

export async function getPreprintCounts() {
	const researchID = await getEntityID('Research','category')
	
	var counts = await db.query(escape`

	SELECT d.is_preprint, COUNT(*) as count
	FROM documents d, annotations a
	WHERE d.document_id = a.document_id
	AND a.entity_id = ${researchID}
	GROUP BY d.is_preprint
    ORDER BY d.is_preprint

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return {'peer_reviewed': counts[0].count, 'preprint': counts[1].count}
}

export async function getCategoryCountsByVirus() {
	var counts = await db.query(escape`

	SELECT e_category.name as category, e_virus.name as virus, COUNT(*) as count
	FROM annotations anno_category, entities e_category, entitytypes et_category, annotations anno_virus, entities e_virus, entitytypes et_virus
	WHERE anno_category.document_id = anno_virus.document_id
	AND anno_category.entity_id = e_category.entity_id
	AND e_category.entitytype_id = et_category.entitytype_id
	AND et_category.name = 'category'
	AND anno_virus.entity_id = e_virus.entity_id
	AND e_virus.entitytype_id = et_virus.entitytype_id
	AND et_virus.name = 'Virus'
	GROUP BY category, virus
	ORDER BY count
	`)
	
	// anno_category.document_id < 5000 (for testing purposes only)
	
	counts = counts.map(r => Object.assign({},r))
	
	const viruses = ['MERS-CoV','SARS-CoV','SARS-CoV-2']
	
	var wide_data = {}
	
	counts.forEach( row => {
		const v = row['virus']
		const category = row['category']
		const count = row['count']
		
		if (category == 'Research')
			return
		
		if (! (category in wide_data)) {
			wide_data[category] = {'category':category,'MERS-CoV':0,'SARS-CoV':0,'SARS-CoV-2':0}
		}
		
		wide_data[category][v] = count
	})
	
	const result = Object.values(wide_data)
	
	return result
	
}

export async function getSummaryStatistics() {
	var result = await db.query(escape`

	SELECT COUNT(*) as count 
	FROM documents

	`)
	const allDocCount = result[0].count
	
	result = await db.query(escape`
	
	SELECT COUNT(*) as count 
	FROM documents
	WHERE publish_year != ''
	AND publish_month != ''
	AND publish_day != ''
	AND ABS(DATEDIFF(CONCAT(publish_year,'-',LPAD(publish_month,2,'00'),'-',LPAD(publish_day,2,'00')), CURDATE())) <= 7
	
	`)
	const lastWeekDocCount = result[0].count
	
	/*var result = await db.query(escape`

	SELECT COUNT(*) as count
	FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id
	AND et.name = 'category'

	`)
	const categoryCount = result[0].count*/
	
	const categoryCount = pages.length - 4 // Reviews, Comments & Editorials, Book Chapters & Updates
	
	return {
		allDocCount,
		lastWeekDocCount,
		categoryCount
	}
}


export async function getVirusByDate() {
	var counts = await db.query(escape`

	SELECT name as entity_name, publish_year, publish_month, COUNT(*) as count FROM (
	SELECT * FROM
		(SELECT a.document_id as document_id1,e.name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.name = 'virus') as tmp1 
		JOIN 
			(SELECT d.document_id as document_id2, d.publish_year, d.publish_month
			FROM documents d) as tmp2 
		ON tmp1.document_id1 = tmp2.document_id2) as tmp3 
	GROUP BY entity_name,publish_year,publish_month

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}


export async function getRecentTrendingDocuments() {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.publish_month, d.publish_day, d.doi, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype, d.annotations_json
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
		
		doc['is_preprint'] = doc['is_preprint'] ? 'Preprint' : 'Not preprint'
		
		doc['entities'] = JSON.parse(doc['annotations_json'])
		doc['entities'].forEach( e => { delete e.positions} )
		delete doc.annotations_json
	})
	
	return Object.values(documentsByID)
}

export async function getEntityChartData(entitytype,topLimit) {
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
