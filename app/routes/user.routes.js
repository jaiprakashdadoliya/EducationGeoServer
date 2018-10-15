/**
 * User Routes
 *
 * @package                iVizon
 * @subpackage             User Routes
 * @category               Routes
 * @DateOfCreation         12 Jun 2018
 * @ShortDescription       This is responsible for all api routes for users
 */
const path = require('path');
const redis = require('redis');
const cron = require('node-cron');
const pubClient = redis.createClient();
const Config = require('../../config/app.config');
const sub = redis.createClient();
const pub = redis.createClient();
require(path.resolve('helpers/util'));
const userModel = require('../models/user.modal.js');

process.setMaxListeners(0);//Maximum Listeners
var boundObject = [];
var userObject  = [];

module.exports = (app) => {
    // const user = require(path.resolve('app/controllers/user.controller'));
    //Websocket Port connection with specific user id
    app.ws('/user/:busid', (s, req) => {
        s.on('message', function(data) {
            var locationData = JSON.parse(data);//Request json data from devices
            var vehicleRouteId;
            switch (locationData.action) {
                case 'bus_tracking':
                    // add data into locationData array.
                    locationData.getCurrentDate = new Date();
                    locationData.userAgent = req.headers['user-agent'];
                    locationData.ipAddress = req.connection.remoteAddress;
                    // subscribe the channel
                    sub.subscribe('ch_'+req.params.busid);

                    // check validation
                    var isCheck = 0;
                    var errMessage = [];
                    if(locationData.action === "" && typeof locationData.action === "string"){
                      errMessage.push('Action is required');
                      isCheck = 1;
                    }
                    if(locationData.vehicle_id === "" && typeof locationData.vehicle_id === "string"){
                      errMessage.push('Vehicle id is required');
                      isCheck = 1;
                    }
                    if(locationData.route_id === "" && typeof locationData.route_id === "string"){
                      errMessage.push('Route id is required');
                      isCheck = 1;
                    }
                    if(locationData.school_id === "" && typeof locationData.school_id === "string"){
                      errMessage.push('School id is required');
                      isCheck = 1;
                    }
                    if(locationData.user_id === "" && typeof locationData.user_id === "string"){
                        errMessage.push('User id is required');
                        isCheck = 1;
                    }
                    if(locationData.vehicle_route_id === "" && typeof locationData.vehicle_route_id === "string"){
                      errMessage.push('Vehicle route id is required');
                      isCheck = 1;
                    }

                    if(isCheck == 1){
                      var message = {
                          errors: errMessage,
                      }
                      pub.publish('ch_'+req.params.busid, JSON.stringify(message));
                      return false;
                    }

                    var message = {
                        action: locationData.action,
                        lat: locationData.lat.toString(),
                        long: locationData.long.toString(),
                        vehicle_id: locationData.vehicle_id,
                        route_id: locationData.route_id,
                        school_id: locationData.school_id,
                        user_id: locationData.user_id,
                        vehicle_route_id: locationData.vehicle_route_id
                    };

                    // publish the channel
                    pub.publish('ch_'+req.params.busid, JSON.stringify(message));
                    // calling user.model method to data insert and update
                    userModel.bus_tracking(locationData);
                    break;

                case 'checkin':
                    vehicleRouteId = req.params.busid;
                    // add data into locationData array.
                    locationData.getCurrentDate = new Date();
                    locationData.userAgent = req.headers['user-agent'];
                    locationData.ipAddress = req.connection.remoteAddress;

                    // check validation
                    var isCheck = 0;
                    var errMessage = [];
                    if(locationData.user_id === "" && typeof locationData.user_id === "string"){
                        errMessage.push('User id is required');
                        isCheck = 1;
                    }
                    if(locationData.action === "" && typeof locationData.action === "string"){
                      errMessage.push('Action is required');
                      isCheck = 1;
                    }
                    if(locationData.type === "" && typeof locationData.type === "string"){
                      errMessage.push('Type is required');
                      isCheck = 1;
                    }
                    if(locationData.stoppage_id === "" && typeof locationData.stoppage_id === "string"){
                      errMessage.push('Stoppage id is required');
                      isCheck = 1;
                    }
                    if(locationData.school_id === "" && typeof locationData.school_id === "string"){
                      errMessage.push('School id is required');
                      isCheck = 1;
                    }
                    if(locationData.route_id === "" && typeof locationData.route_id === "string"){
                      errMessage.push('Route id is required');
                      isCheck = 1;
                    }
                    if(locationData.vehicle_id === "" && typeof locationData.vehicle_id === "string"){
                      errMessage.push('Vehicle id is required');
                      isCheck = 1;
                    }
                    if(locationData.token === "" && typeof locationData.token === "string"){
                      errMessage.push('Token is required');
                      isCheck = 1;
                    }

                    if(isCheck == 1){
                      sub.subscribe('ch_'+vehicleRouteId);
                      var message = {
                          errors: errMessage,
                      }
                      pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                      return false;
                    }

                    // send data into user.model checkin method.
                    userModel.checkin(locationData, vehicleRouteId, s);
                    break;

                // delay api
                case 'delay':
                    vehicleRouteId = req.params.busid;

                    // add data into locationData array.
                    locationData.getCurrentDate = new Date();
                    locationData.userAgent = req.headers['user-agent'];
                    locationData.ipAddress = req.connection.remoteAddress;

                    // check validation
                    var isCheck = 0;
                    var errMessage = [];
                    if(locationData.action === "" && typeof locationData.action === "string"){
                      errMessage.push('Action is required');
                      isCheck = 1;
                    }
                    if(locationData.duration === "" && typeof locationData.duration === "string"){
                      errMessage.push('Duration is requred');
                      isCheck = 1;
                    }
                    if(locationData.trip_id === "" && typeof locationData.trip_id === "string"){
                      errMessage.push('Trip id is required');
                      isCheck = 1;
                    }
                    if(locationData.current_stoppage_id === "" && typeof locationData.current_stoppage_id === "string"){
                      errMessage.push('Current stoppage id is required');
                      isCheck = 1;
                    }
                    if(locationData.vehicle_id === "" && typeof locationData.vehicle_id === "string"){
                      errMessage.push('Vehicle id is required');
                      isCheck = 1;
                    }
                    if(locationData.route_id === "" && typeof locationData.route_id === "string"){
                      errMessage.push('Route id is required');
                      isCheck = 1;
                    }
                    if(locationData.school_id === "" && typeof locationData.school_id === "string"){
                      errMessage.push('School id is required');
                      isCheck = 1;
                    }
                    if(locationData.user_id === "" && typeof locationData.user_id === "string"){
                        errMessage.push('User id is required');
                        isCheck = 1;
                    }
                    if(locationData.token === "" && typeof locationData.token === "string"){
                      errMessage.push('Token is required');
                      isCheck = 1;
                    }
                    if(isCheck == 1){
                      sub.subscribe('ch_'+vehicleRouteId);
                      var message = {
                          errors: errMessage,
                      }
                      pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                      return false;
                    }

                    // send data into user.model delay method
                    userModel.delay(locationData, vehicleRouteId, s);

                  break;

                //Unpublish Request
                case 'unpublish':
                    pubClient.smembers('geofences', function(err, keys){
                        keys.forEach(function(key){
                            var curKey = 'reg_'+locationData.user_id;
                            if(key != curKey){
                                var channel = key.replace('reg', 'ch');
                                pub.publish(channel, JSON.stringify(message));
                            }
                        });
                    })
                    break;

                //Watching Request
                case 'watching':
                    //Checking Viewer
                    if(locationData.w == 0){
                        //Closing Fence Object
                        boundObject[locationData.user_id].close();//
                    } else {
                        var userData= locationData.user_id+'_'+(Math.round(new Date() / 1000));
                        // We are user with their alive status in javascript array  because on server restart we are destroying we flush all Tile38 and Redis data already
                        var el = userObject.findIndex(function(el) {
                            var userDetails = el.userDetails.split('_');
                            return userDetails[0] === locationData.user_id;
                        });
                        if(el != -1){
                            userObject[el].userDetails = userData;
                        } else {
                            userObject.push({userDetails :userData});
                        }
                    }
                    break;
            }

        });

        //Receiving messages on channel
        sub.on('message', function (channel, message) {
            if(channel == 'ch_'+req.params.busid) {
                s.send((message), ()=>{});
            }
        });

    });

    //Setting up cron which will run on given time
    cron.schedule('*/'+Config.WATCHING_TIME+' * * * * *', checkUser);
    function checkUser(){

        var currentTime = Math.round(new Date() / 1000);
        userObject.forEach(function(key){
            var userData = key.userDetails.split('_');
            var user_id = userData[0];
            var userTime = userData[1];

            if((currentTime-userTime) > Config.WATCHING_TIME){
                userObject.removeIf( function(item) {
                    var userDetails = item.userDetails.split('_');
                    return userDetails[0] == user_id;
                });
                if(typeof boundObject[user_id] != 'undefined'){
                    boundObject[user_id].close();
                }
            }
        });
    }
}
