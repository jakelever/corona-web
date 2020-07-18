
import { searchEntities } from '../../lib/db-search.js'

export default async (req, res) => {
	if (!req.query.q)
	{
		res.statusCode = 200
		res.end(JSON.stringify(['Not Okay']))
		return
	}
	
	const entities = await searchEntities(req.query.q)
	
	const results = entities.map(e => { return {name:e.entity_name,type:e.entity_type} } )
	
	res.statusCode = 200
	res.end(JSON.stringify(results))
}
