const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const express = require('express');

const httpRedirectServer = express();

// set up a route to redirect http to https
httpRedirectServer.get('*', (request, response) => {
    response.redirect('https://' + request.headers.host + request.url);
});

httpRedirectServer.listen(80);
httpRedirectServer.on('listening', () => {
    console.log("Listening to redirect http to https");
});

// now start the https server with the nextjs app
const httpsOptions = {
  key: fs.readFileSync('./certificates/coronacentral_ai.key'),
  cert: fs.readFileSync('./certificates/coronacentral_ai.crt'),
  ca: fs.readFileSync('./certificates/coronacentral_ai.ca-bundle')
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
    
  }).listen(443, err => {
    if (err) throw err;
    console.log('> Ready on https://localhost:443');
  });
});

