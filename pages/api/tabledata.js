const db = require('../../lib/db')
const escape = require('sql-template-strings')

module.exports = async (req, res) => {
//static async (req, res) => {
  /*let page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 9
  if (page < 1) page = 1
  const profiles = await db.query(escape`
      SELECT *
      FROM profiles
      ORDER BY id
      LIMIT ${(page - 1) * limit}, ${limit}
    `)
  const count = await db.query(escape`
      SELECT COUNT(*)
      AS profilesCount
      FROM profiles
    `)
  const { profilesCount } = count[0]
  const pageCount = Math.ceil(profilesCount / limit)
  res.status(200).json({ profiles, pageCount, page })*/
  
	const topic = 'topic' in req.query ? req.query.topic : 'Drug Repurposing'
  
	const documents = await db.query(escape`

	SELECT d.document_id, d.title, d.url, d.journal, d.publish_year FROM documents d
	JOIN
	(SELECT a.document_id
	FROM annotations a, entities e, entitytypes et 
	WHERE e.entity_name = ${topic} 
		AND et.entitytype_name = 'topic' 
		AND e.entity_id = a.entity_id 
		AND e.entitytype_id = et.entitytype_id) as tmp
	ON d.document_id = tmp.document_id

	`)
	
	const documentToObject = (array) =>
		array.reduce((obj, item) => {
			item.entities = []
			obj[item.document_id] = item
			return obj
		}, {})
	
	var documentsByID = documentToObject(documents)
	
	const annotations = await db.query(escape`
	SELECT a.document_id, e.entity_name, et.entitytype_name 
	FROM annotations a, entities e, entitytypes et 
	WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id
	`)
	
	annotations.map(function(anno) {
		if (! (anno.document_id in documentsByID) )
			return false
		
		var doc = documentsByID[anno.document_id]
		const entity_name = anno.entity_name
		const entity_type = anno.entitytype_name
		
		//if (! (entity_type in doc.entities))
		//	doc.entities[entity_type] = []
		
		const entity = {name: entity_name, type: entity_type}
		doc.entities.push(entity)
	})
	
   res.status(200).json({ documents:Object.values(documentsByID) })
}
