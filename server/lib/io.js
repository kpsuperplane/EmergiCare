var socketio = require('socket.io');
var firebase = require('firebase');
var firebaseHelpers = require('../lib/firebaseHelpers.js');

module.exports.listen = function (app) {
  io = socketio.listen(app);
  io.on('connection', function (socket) {
    var ref = firebase.database().ref("/");
    firebaseHelpers.query(ref).then(function (res) {
      io.emit('locations:initialize', res);
    });
  });
    
  return io;
};