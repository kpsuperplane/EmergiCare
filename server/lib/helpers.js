var request = require('request');
var fs = require('fs');
var protobuf = require('protocol-buffers');
var messages = protobuf(fs.readFileSync('./lib/gtfs-realtime.proto')); 

function toRad (value) {
  /** Converts numeric degrees to radians */
  return value * Math.PI / 180;
}

function getDist(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null)
    return 1 << 30;
  console.log(lat1, lon1, lat2, lon2);
  //Radius of the earth in:  1.609344 miles,  6371 km  | var R = (6371 / 1.609344);
  var R = 3958.7558657440545; // Radius of earth in Miles 
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

function getVehicles () {
  var requestSettings = {
    method: 'GET',
    url: 'http://192.237.29.212:8080/gtfsrealtime/VehiclePositions',
    encoding: null
  };
  return new Promise(function (resolve) {
    request(requestSettings, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var obj = messages.FeedMessage.decode(body);
        var vehiclesObj = {};
        for (var i = 0; i < obj.entity.length; i++) {
          vehiclesObj[obj.entity[i].vehicle.vehicle.id] = {
            latitude: obj.entity[i].vehicle.position.latitude,
            longitude: obj.entity[i].vehicle.position.longitude,
            congestion_level: obj.entity[i].vehicle.congestion_level,
            occupancy_status: obj.entity[i].vehicle.occupancy_status
          };
        }
        resolve(vehiclesObj);
      } else {
        resolve(null);
      }
    });
  });
};

module.exports = {
  getDist: getDist,
  getVehicles: getVehicles
}