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
app.use('/', express.static(__dirname + '/frontend/build/'));

app.post('/calls/resolve', function (req, res) {
  var phoneNumber = req.body.phoneNumber;
  var ref = firebase.database().ref('/settings/' + phoneNumber);
  
  var serviceRef = firebase.database().ref('/services');
  
  // finding all services
  firebaseHelpers.query(serviceRef).then(function (services) {
    var newServices = {};
    for (var serviceName in services) {
      if (services.hasOwnProperty(serviceName) && services[serviceName].handler == phoneNumber) {
        newServices[serviceName] = {
          handler: null,
          type: services[serviceName].type,
          longitude: services[serviceName].longitude,
          latitude: services[serviceName].latitude,
          congestion_level: services[serviceName].congestion_level,
          occupancy_status: services[serviceName].occupancy_status
        };
      }
    }
    
    // deleting all services with specified handler
    firebaseHelpers.update(serviceRef, newServices).then(function () {
      
      var phoneNumberRef = firebase.database().ref('/calls/' + phoneNumber);
      // deleting resolved phone number
      console.log(new Date().getTime());
      firebaseHelpers.update(ref, {lastStopped: new Date().getTime()}).then(function () {
        console.log("UPDATED");
        firebaseHelpers.remove(phoneNumberRef).then(function () {
          firebaseHelpers.query(ref).then(function (callerSettings) {
            if (callerSettings == null || callerSettings.alerts == null) {
              twilioHelpers.sendSms(phoneNumber, TWILIO_CONFIG.number, "stop").then(function () {
                res.status(200);
                res.send("No alert numbers.");
              });
            } else {
              // calling all alert numbers
              var promises = [];

              for (var key in callerSettings.alerts) {
                if (callerSettings.alerts.hasOwnProperty(key)) {
                  var body = "911 issue initiated by " + (callerSettings.name || phoneNumber) + " has been resolved!";
                  promises.push(twilioHelpers.sendSms(key, TWILIO_CONFIG.number, body));
                }
              }

              promises.push(twilioHelpers.sendSms(phoneNumber, TWILIO_CONFIG.number, "stop"));

              Promise.all(promises).then(function () {
                res.status(200);
                res.send("All alert numbers messaged!");
              }).catch(function (err) {
                console.log("A promise failed to resolve", err);
              });
            }
          });
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
  } else if (rawData[0] == 'number:list') {
      var settingsRef = firebase.database().ref("/settings/" + req.body.From + "/alerts");
      firebaseHelpers.query(settingsRef).then(function (alertNumbersMap) {
        var body = "<Response><Message>The alert numbers associated with this number are:\n";
        for (var alertNumber in alertNumbersMap) {
          if (alertNumbersMap.hasOwnProperty(alertNumber)) {
            body += alertNumber + "\n";
          }
        }
        body += "</Message></Response>";
        resp.send(body);
      });
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
      address: ""
    };
    var callsRef = firebase.database().ref("/calls/" + req.body.From);
    var settingsRef = firebase.database().ref("/settings/" + req.body.From);
    
    
    firebaseHelpers.query(settingsRef).then(function (settings) {
      if (settings == null || settings.lastStopped == null || new Date().getTime() - settings.lastStopped >= 30000) {
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
              resp.send("<Response>");
            });
          } else { 
            jsonData.urgency = 0;
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
                resp.send("<Response>");
              });
            })
          }
        }, function (error) {
          if (error)
            console.log(error);
          resp.status(500);
          resp.send("<Response>");
        });
      } else {
        console.log("too soon babyyyyyyyy");
        resp.status(200);
        resp.send("<Response>");
      } 
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
          if (oldServices != null && oldServices[key] != null && oldServices[key].handler != null) {
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

http.listen(process.env.PORT || 8080, function () {
  console.log("Node app is running port", app.get('port')); 
});