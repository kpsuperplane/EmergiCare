var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('./lib/io.js').listen(http);
var morgan = require('morgan');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');
var twilio = require('twilio');
var firebase = require('firebase');
var firebaseHelpers = require('./lib/firebaseHelpers.js');

var FIREBASE_CONFIG = require("./config/firebase_config.js");
firebase.initializeApp(FIREBASE_CONFIG);

var hostname = 'localhost';
var port = 8080;

app.set('port', port);

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', express.static(__dirname + '/public/'));

app.post('/sms/receive', function (req, res) {
  console.log('sms message =', req.body);
  var rawData = req.body.Body.split(";");
  var jsonData = {
    phoneNumber: req.body.From,
    latitude: Number(rawData[0]),
    longitude: Number(rawData[1]),
    accuracy: Number(rawData[2])
  };
  
  var ref = firebase.database().ref("/" + req.body.From);
  firebaseHelpers.save(ref, jsonData).then(function(){
    io.emit('location:update', jsonData);
    res.status(200);
  });
});

http.listen(app.get('port'), function () {
  console.log("Node app is running port", app.get('port')); 
});