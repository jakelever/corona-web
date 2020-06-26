
import { searchEntities } from '../../lib/db-search.js'

export default async (req, res) => {
	if (!req.query.q)
	{
		res.statusCode = 200
		res.end(JSON.stringify(['Not Okay']))
		return
	}
	
	//console.log(req.method)
	//console.log(req.body)
	//console.log(req.query)
	
	const entities = await searchEntities(req.query.q)
	
	const results = entities.map(e => { return {name:e.entity_name,type:e.entity_type} } )
	
	console.log(entities)
	
	res.statusCode = 200
	res.end(JSON.stringify(results))
}
