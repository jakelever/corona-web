
const db = require('../lib/db')
const escape = require('sql-template-strings')

export async function searchEntities(query) {
	//console.log(query)
	const queryWithPercents = '%' + query + '%'
	var entities = await db.query(escape`

	SELECT e.entity_id,e.name as entity_name,et.name as entity_type
	FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id
	AND e.name LIKE ${queryWithPercents}
	LIMIT 10
	`)
	entities = entities.map(r => Object.assign({},r))
	return entities
}