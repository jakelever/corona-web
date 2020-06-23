
const db = require('../lib/db')
const escape = require('sql-template-strings')

export async function getAllDocumentIDs() {
	var documents = await db.query(escape`

	SELECT d.document_id FROM documents d
	ORDER BY d.document_id DESC
	`)
	documents = documents.map(r => Object.assign({},r))
	return documents
}

export async function getDocument(document_id) {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.abstract, d.url, d.journal, d.publish_year, d.doi FROM documents d
	WHERE d.document_id = ${document_id}
	`)
	documents = documents.map(r => Object.assign({},r))
	return documents[0]
}
