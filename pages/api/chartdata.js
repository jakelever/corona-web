const db = require('../../lib/db')
const escape = require('sql-template-strings')

module.exports = async (req, res) => { 
	const topic = 'topic' in req.query ? req.query.topic : 'Drug Repurposing'
  
	const counts = await db.query(escape`

SELECT entity_name, COUNT(*) as count FROM
	(SELECT e.entity_name 
	FROM annotations a, entities e, entitytypes et 
	WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'drug'
		AND a.document_id IN (
			SELECT a.document_id 
			FROM annotations a, entities e, entitytypes et 
			WHERE e.entity_name = 'Drug Repurposing'
				AND a.entity_id = e.entity_id 
				AND e.entitytype_id = et.entitytype_id 
				AND et.entitytype_name = 'topic'
		)) as tmp1 
GROUP BY entity_name
ORDER BY count DESC
LIMIT 30

	`)
	
	
   res.status(200).json({ counts })
}
