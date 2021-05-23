
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
	
	var uniqueEntityResults = {}
	entities.forEach( e => {
		var combined = e.entity_name + '|' + e.entity_type
		uniqueEntityResults[combined] = {name:e.entity_name,type:e.entity_type}
	})
	
	uniqueEntityResults = Object.values(uniqueEntityResults)
	
	const docResults = documents.map(d => { return {name:d.title,type:'Paper',doi:d.doi,pubmed_id:d.pubmed_id,cord_uid:d.cord_uid,url:d.url} } )
	
	const results = uniqueEntityResults.concat(docResults)
	
	res.statusCode = 200
	res.end(JSON.stringify(results))
}
