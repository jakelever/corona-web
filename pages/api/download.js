export default (req, res) => {
	res.statusCode = 200
	res.setHeader('Content-Type', 'application/csv')
	res.setHeader('Content-Disposition', 'inline; filename="myfile.csv"')
	res.end(JSON.stringify({ name: 'John Doe' }))
	console.log(req.query)
}
