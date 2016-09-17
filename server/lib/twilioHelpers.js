var twilio = require('twilio');
var TWILIO_CONFIG = require("../config/twilio_config.js");
var client = new twilio.RestClient(TWILIO_CONFIG.account_sid, TWILIO_CONFIG.auth_token);

function sendSms (to, from, body) {
  return new Promise(function (resolve) {
    client.sms.messages.create({
      to: to,
      from: from,
      body: body
    }, function (error, message) {
      if (!error)
        console.log("Message sent successfully!");
      else
        console.log("Error:", error);
      resolve();
    });
  });
};

module.exports = {
  sendSms: sendSms
};