import queryString from 'query-string'
import url from 'url'

import nodemailer from 'nodemailer'

const emailSettings = process.env.EMAIL
const emailAddress = emailSettings.split(':')[0]
const emailPassword = emailSettings.split(':')[1]

export default (req, res) => {
	res.statusCode = 200
	res.end(JSON.stringify(['Okay']))
	console.log(req.method)
	console.log(req.body)

	var transporter = nodemailer.createTransport({
	  service: 'gmail',
	  auth: {
		user: emailAddress,
		pass: emailPassword
	  }
	});

	var mailOptions = {
		from: emailAddress,
		to: emailAddress,
		subject: 'Document Flagged',
		text: JSON.stringify(req.body)
	};

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	}); 
}
