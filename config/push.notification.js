/**
 * Config Constants
 *
 * @package                iVizon
 * @subpackage             Push Notification
 * @category               Push Notification
 * @DateOfCreation         14 Jun 2018
 * @ShortDescription       This is responsible for send push notification messages to android and ios
 */
const Config = require('./app.config');
var FCM = require('fcm-push');
var serverKey = Config.FCM_SERVER_KEY;
var fcm = new FCM(serverKey);

module.exports = {
  // send fcm notification to android
  send_fcm: function(fcmNotification){
    fcm.send(fcmNotification)
      .then(function(response){
          console.log("Successfully sent with response: ", response);
      })
      .catch(function(err){
          console.log("Something has gone wrong!");
          console.error(err);
      })
  },
}
