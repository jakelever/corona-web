
import { searchEntities, searchDocuments } from '../../lib/db-search.js'

export default async (req, res) => {
	if (!req.query.q)
	{
		res.statusCode = 200
		res.end(JSON.stringify(['Not Okay']))
		return
	}
	
	const entities = await searchEntities(req.query.q)
	
	const documents = await searchDocuments(req.query.q)
	
	const entityResults = entities.map(e => { return {name:e.entity_name,type:e.entity_type} } )
	const docResults = documents.map(d => { return {name:d.title,type:'Paper',doi:d.doi,pubmed_id:d.pubmed_id,cord_uid:d.cord_uid,url:d.url} } )
	
	const results = entityResults.concat(docResults)
	
	res.statusCode = 200
	res.end(JSON.stringify(results))
}
