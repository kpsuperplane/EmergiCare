var express = require('express');
var app = express();
var http = require('http').Server(app);
var morgan = require('morgan');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');
var twilio = require('twilio');
var firebase = require('firebase');
var firebaseHelpers = require('./lib/firebaseHelpers.js');
var helpers = require('./lib/helpers.js');
var request = require('request');
var io = require('./lib/io.js').listen(http);
var protobuf = require('protocol-buffers');
var fs = require('fs');

var messages = protobuf(fs.readFileSync('./lib/gtfs-realtime.proto')); 
var FIREBASE_CONFIG = require("./config/firebase_config.js");

firebase.initializeApp(FIREBASE_CONFIG);

var hostname = 'localhost';
var port = 8080;

app.set('port', port);

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', express.static(__dirname + '/public/'));

app.get('/gtfs', function (req, res) {
  console.log("in gtfs get");
  var requestSettings = {
    method: 'GET',
    url: 'http://192.237.29.212:8080/gtfsrealtime/VehiclePositions',
    encoding: null
  }
  request(requestSettings, function (error, response, body) {
    console.log("ENTERED HERE");
    if (!error && response.statusCode == 200) {
      //console.log(body);
      var obj = messages.FeedMessage.decode(body);
      console.log(obj.entity.length);
      var vehiclesObj = {};
      for (var i = 0; i < obj.entity.length; i++) {
        vehiclesObj[obj.entity[i].vehicle.vehicle.id] = {
          latitude: obj.entity[i].vehicle.position.latitude,
          longitude: obj.entity[i].vehicle.position.longitude,
          congestion_level: obj.entity[i].vehicle.congestion_level,
          occupancy_status: obj.entity[i].vehicle.occupancy_status 
        };
      }
      console.log(vehiclesObj);
      //console.log(obj);
      res.send("done");
    } else {
      res.send("done");
    }
  });
});

app.post('/sms/receive', function (req, resp) {
  console.log('sms message =', req.body);
  var rawData = req.body.Body.split(";");
  var latitude = Number(rawData[0]);
  var longitude = Number(rawData[1]);
  var jsonData = {
    phoneNumber: req.body.From,
    latitude: latitude,
    longitude: longitude,
    accuracy: Number(rawData[2]),
    address: ""
  };
  
  var userRef = firebase.database().ref("/" + req.body.From);
  firebaseHelpers.query(userRef).then(function (res) {
    var dist = helpers.getDist(latitude, longitude, res.latitude, res.longitude);
    console.log(dist);
    console.log(dist < 1);
    if (dist < 1 && res.address != "") {
      console.log("cached");
      jsonData.address = res.address;
      firebaseHelpers.save(userRef, jsonData).then(function() {
        console.log("socket updating", jsonData);
        io.emit('locations:update', jsonData);
        resp.status(200);
      });
    } else { 
      console.log("recalling api");
      request('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&key=' + FIREBASE_CONFIG.googleMapsKey, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var ret = JSON.parse(body);
          if (ret.results == null)
            jsonData.address = "";
          else
            jsonData.address = ret.results[0].formatted_address
        } else {
          jsonData.address = "";
        }
        
        firebaseHelpers.save(userRef, jsonData).then(function() {
          console.log("socket updating", jsonData);
          io.emit('locations:update', jsonData);
          resp.status(200);
        });
      })
    }
  });
});

http.listen(app.get('port'), function () {
  console.log("Node app is running port", app.get('port')); 
});