var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('./io.js').listen(http);
var morgan = require('morgan');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');
var twilio = require('twilio');

var hostname = 'localhost';
var port = 8080;

app.set('port', port);

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', express.static(__dirname + '/public/'));

app.post('/sms/receive', function (req, res) {
  console.log('sms message =', req.body.Body);
  res.type('text/xml');
  res.send("<Response>");
});

http.listen(app.get('port'), function () {
  console.log("Node app is running port", app.get('port')); 
});