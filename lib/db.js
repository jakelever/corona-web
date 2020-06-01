const mysql = require('serverless-mysql')
const url = require('url')

const dburl = url.parse(process.env.JAWSDB_URL)

const db = mysql({
  config: {
    host: dburl.hostname,
    database: dburl.path.replace(/^\//,''),
    user: dburl.auth.split(':')[0],
    password: dburl.auth.split(':')[1]
  }
})


exports.query = async query => {
	//try {
	const results = await db.query(query)
	await db.end()
	return results
	/*} catch (error) {
		return { error }
	}*/
}
