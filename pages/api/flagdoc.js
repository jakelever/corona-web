export default (req, res) => {
	res.statusCode = 200
	res.end(JSON.stringify(['Okay']))
	console.log(req.trailers)
}
