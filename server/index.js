var express = require('express');
var app = express();
var http = require('http').Server(app);
var morgan = require('morgan');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');
var twilio = require('twilio');
var firebase = require('firebase');
var firebaseHelpers = require('./lib/firebaseHelpers.js');
var twilioHelpers = require('./lib/twilioHelpers.js');
var helpers = require('./lib/helpers.js');
var request = require('request');
var path = require('path');

var FIREBASE_CONFIG = require("./config/firebase_config.js");
var TWILIO_CONFIG = require("./config/twilio_config.js");

var client = new twilio.RestClient(TWILIO_CONFIG.account_sid, TWILIO_CONFIG.auth_token);

firebase.initializeApp(FIREBASE_CONFIG);

var hostname = 'localhost';
var port = 8080;

app.set('port', port);

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(__dirname + '/../frontend/build/'));

app.post('/calls/resolve', function (req, res) {
  var phoneNumber = req.body.phoneNumber;
  console.log(req.body);
  var ref = firebase.database().ref('/settings/' + phoneNumber);
  
  var serviceRef = firebase.database().ref('/services');
  
  // finding all services
  firebaseHelpers.query(serviceRef).then(function (services) {
    var newServices = {};
    for (var serviceName in services) {
      console.log(services[serviceName].handler, phoneNumber);
      if (services.hasOwnProperty(serviceName) && services[serviceName].handler == phoneNumber) {
        newServices[serviceName] = {
          handler: null,
          type: services[serviceName].type,
          longitude: services[serviceName].longitude,
          latitude: services[serviceName].latitude,
          congestion_level: services[serviceName].congestion_level,
          occupancy_status: services[serviceName].occupancy_status
        };
        console.log(serviceName, services[serviceName].handler);
      }
    }
    console.log(newServices);
    // deleting all services with specified handler
    firebaseHelpers.update(serviceRef, newServices).then(function () {
      
      var phoneNumberRef = firebase.database().ref('/calls/' + phoneNumber);
      // deleting resolved phone number
      firebaseHelpers.remove(phoneNumberRef).then(function () {
        firebaseHelpers.query(ref).then(function (callerSettings) {
          if (callerSettings == null || callerSettings.alerts == null) {
            res.status(200);
            res.send("No alert numbers.");
          } else {
            // calling all alert numbers
            var promises = [];

            for (var key in callerSettings.alerts) {
              if (callerSettings.alerts.hasOwnProperty(key)) {
                var body = "911 issue initiated by " + (callerSettings.name || phoneNumber) + " has been resolved!";
                promises.push(twilioHelpers.sendSms(key, TWILIO_CONFIG.number, body));
              }
            }

            Promise.all(promises).then(function (values) {
              res.status(200);
              res.send("All alert numbers messaged!");
            });
          }
        });
      });
    });
  });
});

app.post('/sms/receive', function (req, resp) {
  console.log("receieved text");
  var rawData = req.body.Body.split(" ");
  if (rawData.length >= 2) {
    if (rawData[0] == "name:set") {
      var settingsRef = firebase.database().ref("/settings/" + req.body.From);
      var name = rawData.slice(1).join(" ");
      firebaseHelpers.update(settingsRef, {
        name: name
      }).then(function () {
        resp.send("<Response><Message>Name succesfully set to: " + name + "!</Message></Response>");
      });
    } else if (rawData[0] == "number:add") {
      var settingsRef = firebase.database().ref("/settings/" + req.body.From + "/alerts");
      var number = rawData[1];
      var data = {};
      data[number] = true;
      firebaseHelpers.update(settingsRef, data).then(function () {
        resp.send("<Response><Message>Added: " + number + " to alert list!</Message></Response>");
      });
    } else if (rawData[0] == 'number:remove') {
      var number = rawData[1];
      var settingsRef = firebase.database().ref("/settings/" + req.body.From + "/alerts/" + number);
      firebaseHelpers.remove(settingsRef).then(function () {
        resp.send("<Response><Message>Removed: " + number + " from alert list!</Message></Response>")
      });
    }
  } else {
    console.log("location update");
    rawData = req.body.Body.split(";");

    var latitude = Number(rawData[0]);
    var longitude = Number(rawData[1]);
    var jsonData = {
      phoneNumber: req.body.From,
      latitude: latitude,
      longitude: longitude,
      accuracy: Number(rawData[2]),
      address: "",
      urgency: 0
    };

    var callsRef = firebase.database().ref("/calls/" + req.body.From);
    firebaseHelpers.query(callsRef).then(function (res) {
      if (res == null) {
        res = {
          latitude: null,
          longitude: null
        };
      }

      var dist = helpers.getDist(latitude, longitude, res.latitude, res.longitude);

      if (dist < 1 && res.address != "") {
        console.log("cached");
        jsonData.address = res.address;
        firebaseHelpers.update(callsRef, jsonData).then(function () {
          resp.status(200);
          resp.send();
        });
      } else { 
        console.log("recomputing");
        request('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&key=' + FIREBASE_CONFIG.googleMapsKey, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var ret = JSON.parse(body);
            if (ret.results == null || ret.results[0] == null || ret.results[0].formatted_address == null)
              jsonData.address = "";
            else
              jsonData.address = ret.results[0].formatted_address
          } else {
            jsonData.address = "";
          }

          firebaseHelpers.update(callsRef, jsonData).then(function() {
            resp.status(200);
            resp.send();
          });
        })
      }
    }, function (error) {
      if (error)
        console.log(error);
      resp.status(500);
      resp.send();
    });
  }
});

// updating the services
setInterval(function () {
  console.log("in updating services");
  var servicesRef = firebase.database().ref("/services/");
  helpers.getVehicles().then(function (newServices) {
    firebaseHelpers.query(servicesRef).then(function (oldServices) {
      for (var key in newServices) {
        if (newServices.hasOwnProperty(key)) {
          if (oldServices[key] != null && oldServices[key].handler != null) {
            newServices[key].handler = oldServices[key].handler;
          }
        }
      }
      firebaseHelpers.set(servicesRef, newServices).then(function () {
        console.log("Set services");
      });
    });
  });
}, 35000);

http.listen(app.get('port'), function () {
  console.log("Node app is running port", app.get('port')); 
});