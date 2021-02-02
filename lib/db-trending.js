
const db = require('./db')
const escape = require('sql-template-strings')

export async function getTrendingDocuments() {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.doi, d.is_preprint, d.publish_year, d.publish_month, d.publish_day, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype, d.annotations_json
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