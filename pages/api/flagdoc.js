import queryString from 'query-string'
import url from 'url'

export default (req, res) => {
	res.statusCode = 200
	res.end(JSON.stringify(['Okay']))
	console.log(req.method)
	console.log(req.body)
}
