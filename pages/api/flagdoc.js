import nodemailer from 'nodemailer'

const emailSettings = process.env.EMAIL
const emailAddress = emailSettings.split(':')[0]
const emailPassword = emailSettings.split(':')[1]

export default async function handler(req, res) {
	
	if (! ('recaptcha' in req.body)) {
		console.log('no recaptcha')
		
		res.statusCode = 401
		res.end('No recaptcha!')
		return
	}
	
	const secret = process.env.RECAPTCHA_SECRET
	const parameters = `secret=${secret}&response=${req.body.recaptcha}`
	
	const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
		method: 'POST',
		headers: new Headers({
			'Content-Type': 'application/x-www-form-urlencoded', // <-- Specifying the Content-Type
		}),
		body: parameters
	})
	
	const recaptchaJSON = await recaptchaResponse.json()
	
	if (!('success' in recaptchaJSON) || recaptchaJSON.success == false) {
		console.log('recaptcha failed')
		
		res.statusCode = 401
		res.end('recaptcha failed')
		return
	}

	var transporter = nodemailer.createTransport({
	  host: "smtp-relay.sendinblue.com",
	  port: 587,
	  secure: false,
	  auth: {
		user: emailAddress,
		pass: emailPassword
	  }
	});
	
	delete req.body.recaptcha

	var mailOptions = {
		from: emailAddress,
		to: emailAddress,
		subject: 'Document Flagged',
		text: JSON.stringify(req.body)
	}

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			//console.log('Email sent: ' + info.response);
		}
	})
	
	res.statusCode = 200
	res.end('OK')
}
