const Config = require('../../config/app.config');
const dbConfig = require('../../config/database.config.js');
const Message = require('../../config/message.constant');
const pushNotification = require('../../config/push.notification');
const redis = require('redis');
const sub = redis.createClient();
const pub = redis.createClient();
var http = require('http');

module.exports = {
  // bus tracking method
  bus_tracking: function(req) {
    // select data from vehicle_stoppages
    var selectQuery = 'SELECT vehicle_id from vehicle_current_location where school_id = $1 and is_deleted = $2';
    var selectQueryValues = [req.school_id, 0];

    // Prepare data for insert into vehicle_stoppages table
    var insertData = 'INSERT INTO vehicle_current_location(vehicle_current_location_latitude, vehicle_current_location_longitude, vehicle_id, route_id, vehicle_route_id, school_id, created_by, created_at, resource_type, is_deleted, user_agent, ip_address) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING vehicle_current_location_id'
    var insertValues = [req.lat, req.long, req.vehicle_id, req.route_id, req.vehicle_route_id, req.school_id, req.user_id, req.getCurrentDate, 'android', 0, req.userAgent, req.ipAddress]

    // Prepare data for insert into vehicle_stoppage_history table
    var insertDataStoppageHistory = 'INSERT INTO vehicle_location_history(vehicle_location_history_latitude, vehicle_location_history_longitude, vehicle_id, route_id, school_id, created_by, created_at, resource_type, is_deleted, user_agent, ip_address) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING vehicle_location_history_id'
    var insertValuesStoppageHistory = [req.lat, req.long, req.vehicle_id, req.route_id, req.school_id, req.user_id, req.getCurrentDate, 'android', '0', req.userAgent, req.ipAddress]

    // Prepare data for update data into vehicle_stoppages table
    var updateData = 'UPDATE vehicle_current_location SET vehicle_current_location_latitude = $1, vehicle_current_location_longitude = $2, school_id = $3, updated_by = $4, updated_at = $5, resource_type = $6, is_deleted = $7, user_agent = $8, ip_address = $9 where vehicle_id = $10';
    var updateValues = [req.lat, req.long, req.school_id, req.user_id, req.getCurrentDate, 'android', '0', req.userAgent, req.ipAddress, req.vehicle_id]

    // Get data from vehicle_stoppages
    this.sqlQuery(selectQuery, selectQueryValues)
      .then(res => {
          if(res.rowCount > 0){
              // if vehicle id exist then do update vehicle_current_location table
              this.sqlQuery(updateData, updateValues)
                .then(res => {
                    // Successfully updated to bus tracking
                })
          } else {
            // if vehicle id not exist then do insert record into vehicle_current_location table
            this.sqlQuery(insertData, insertValues)
              .then(res => {
                  // Successfully inserted into bus tracking
              })
          }
      })

      // Do insert record into vehicle_location_history table
      this.sqlQuery(insertDataStoppageHistory, insertValuesStoppageHistory)
        .then(res => {
            // Record successfully inserted into bus tracking hsitory
        })
  },

  // user checin method
  checkin: function(req, vehicleRouteId, s) {
      sub.subscribe('ch_'+vehicleRouteId);
      var checkinType = req.checkin_type;
      var selectStudentQueryValues = [req.student_id];
      var selectStudentQuery = 'select name from students where student_id = $1 and is_deleted = 0';
      var studentName;
      var msgBody;
      var msgTitle;
      var notificationType;
      var androidTokens = [];
      var iosTokens = [];
      var parents = [];
      var studentCheckinId;
      var isCheckinCheckout = 1;    // 2 = bus checkin and 3 = bus_checkout
      // var todayDate = new Date().toISOString().slice(0, 10);
      var todayTime = new Date().toLocaleTimeString('indian', { hour: 'numeric', minute: 'numeric', hour12: true });
      // get data from student table
      var getResult = this.sqlQuery(selectStudentQuery, selectStudentQueryValues)
        .then(res => {
            if(res.rowCount > 0){
                studentName = res.rows[0].name;
                // define variable for checkin
                var checkinStoppageId;
                var checkinLatitude;
                var checkinLongitude;
                var checkinTime;
                var createdBy;
                var createdAt;
                var checkinSource;

                // define variable for checkout
                var checkoutStoppageId;
                var checkoutLatitude;
                var checkoutLongitude;
                var checkoutTime;
                var updatedBy;
                var updatedAt;
                var checkoutSource;

                // get vehicle registration number from vehicles table
                this.sqlQuery('select registration_number, vehicle_name from vehicles where vehicle_id = $1 and school_id = $2 and is_deleted = $3', [req.vehicle_id, req.school_id, 0])
                  .then(res => {
                      if(res.rowCount > 0){
                          var vehicleRegistrationNo = res.rows[0].registration_number;
                          var vehicleName = res.rows[0].vehicle_name;
                          // get stoppage name from stoppages table
                          this.sqlQuery('select stoppage_name from stoppages where stoppage_id = $1 and school_id = $2 and is_deleted = $3', [req.stoppage_id, req.school_id, 0])
                            .then(res => {
                                if(res.rowCount > 0){
                                    var vehicleStoppageName = res.rows[0].stoppage_name;
                                    //  check student type
                                    switch (checkinType) {
                                      case 'bus-checkin-approval':
                                          //bus-checkin-from-home
                                          isCheckinCheckout = 2;
                                          msgBody='Your child "'+ studentName +'" is check-in to "'+vehicleName+'" "'+vehicleRegistrationNo+'" at "'+todayTime+'" from "'+vehicleStoppageName+'", please approve it.';
                                          msgTitle='Bus checkin from stoppage';
                                          notificationType='bus-checkin-approval';
                                          checkinStoppageId = req.stoppage_id;
                                          checkinLatitude = req.latitude;
                                          checkinLongitude = req.longitude;
                                          checkinTime = req.getCurrentDate;
                                          createdBy = req.user_id;
                                          createdAt = req.getCurrentDate;
                                          checkinSource = 'assistant';

                                        break;
                                      case 'bus-checkout-to-school':
                                          isCheckinCheckout = 3;
                                          msgBody='Your child "'+ studentName +'" is check-out from "'+vehicleName+'" "'+vehicleRegistrationNo+'" to "'+vehicleStoppageName+'" at "'+todayTime+'".';
                                          msgTitle='Checkout from bus to school';
                                          notificationType='bus-checkout-to-school';
                                          checkoutStoppageId = req.stoppage_id;
                                          checkoutLatitude =  req.latitude;
                                          checkoutLongitude = req.longitude;
                                          checkoutTime = req.getCurrentDate;
                                          updatedBy = req.user_id;
                                          updatedAt = req.getCurrentDate;
                                          checkoutSource = 'assistant';

                                        break;
                                      case 'bus-checkin-from-school':
                                          isCheckinCheckout = 2;
                                          msgBody='Your child "'+ studentName +'" is check-in to "'+vehicleName+'" "'+vehicleRegistrationNo+'" at "'+todayTime+'" from "'+vehicleStoppageName+'".';
                                          msgTitle='Checkin from school to bus';
                                          notificationType='bus-checkin-from-school';
                                          checkinStoppageId = req.stoppage_id;
                                          checkinLatitude = req.latitude;
                                          checkinLongitude = req.longitude;
                                          checkinTime = req.getCurrentDate;
                                          createdBy = req.user_id;
                                          createdAt = req.getCurrentDate;
                                          checkinSource = 'assistant';

                                        break;
                                      case 'bus-checkout-approval':
                                          //bus-checkout-to-home
                                          isCheckinCheckout = 3;
                                          msgBody='Your child "'+ studentName +'" is check-out from "'+vehicleName+'" "'+vehicleRegistrationNo+'" at "'+vehicleStoppageName+'" by "'+todayTime+'", please approve it.';
                                          msgTitle='Checkout from bus to stoppage';
                                          notificationType='bus-checkout-approval';
                                          checkoutStoppageId = req.stoppage_id;
                                          checkoutLatitude =  req.latitude;
                                          checkoutLongitude = req.longitude;
                                          checkoutTime = req.getCurrentDate;
                                          updatedBy = req.user_id;
                                          updatedAt = req.getCurrentDate;
                                          checkoutSource = 'assistant';

                                        break;
                                      default:
                                          var message = {
                                              status  : Config.FAILURE,
                                              error  : Message.INVALID_CHECKIN_TYPE,
                                          };
                                          pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                                        return false;
                                        break;
                                    }

                                    var routeType;
                                    var getVehicleRoute = 'select route_type from student_vehicle_routes where student_id = $1 and vehicle_id = $2 and school_id = $3 and vehicle_route_id = $4 and is_deleted = $5';
                                    var getRouteValues = [req.student_id, req.vehicle_id, req.school_id, vehicleRouteId, 0];
                                    // get route type from student vehicle routes
                                    this.sqlQuery(getVehicleRoute, getRouteValues)
                                      .then(res => {
                                          if(res.rowCount > 0){
                                              routeType = res.rows[0].route_type;
                                              //find devide token to send push notification
                                              var selectTokenQuery = 'select devices.device_token, devices.device_type, student_parents.user_id from devices left join student_parents on student_parents.user_id = devices.user_id where student_parents.student_id = $1 and student_parents.is_deleted=0 and devices.is_deleted=0';
                                              var selectTokenQueryValues = [req.student_id];
                                              this.sqlQuery(selectTokenQuery, selectTokenQueryValues)
                                                .then(res => {
                                                    if(res.rowCount > 0){
                                                      var tokens = res.rows;
                                                      if(isCheckinCheckout === 2){
                                                          // get records form student checkins if student already checkin
                                                          this.sqlQuery('select student_checkin_id from student_checkins where student_id = $1 and vehicle_id = $2 and created_at::date = $3 and route_type = $4 and is_deleted = $5 and checkin_time is not null ', [req.student_id, req.vehicle_id, req.getCurrentDate, routeType, 0])
                                                            .then(res => {
                                                                if(res.rowCount > 0){
                                                                    // you can't checkin already checkin child
                                                                    var message = {
                                                                        status  : Message.INVALID_REQUEST,
                                                                        error  : Message.ALLREDY_CHECKEDIN_CHILD,
                                                                    };
                                                                    // publish the channel
                                                                    pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                                                                    return false;
                                                                } else {
                                                                    // insert data into student checkins table
                                                                    var insertCheckinValues = [req.student_id, req.user_id, req.vehicle_id, req.route_id, req.school_id, checkinStoppageId, checkoutStoppageId, checkinLatitude, checkinLongitude, checkoutLatitude, checkoutLongitude, checkinSource, 'assistant', routeType, checkinTime, checkoutTime, 'ios', req.userAgent, req.ipAddress, 0, createdBy, updatedBy, createdAt, updatedAt];
                                                                    var insertCheckinQuery = 'insert into student_checkins(student_id, user_id, vehicle_id, route_id, school_id, checkin_stoppage_id, checkout_stoppage_id, checkin_latitude, checkin_longitude, checkout_latitude, checkout_longitude, checkin_source, checkout_source, route_type, checkin_time, checkout_time, resource_type, user_agent, ip_address, is_deleted, created_by, updated_by, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) RETURNING student_checkin_id';

                                                                    this.sqlQuery(insertCheckinQuery, insertCheckinValues)
                                                                      .then(res => {
                                                                          // successfully insert into student checkins
                                                                      })
                                                                }
                                                            })
                                                        }
                                                        // update data into student checkins table
                                                        if(isCheckinCheckout === 3){
                                                            var updateStudentValues = [checkoutStoppageId, checkoutLatitude, checkoutLongitude, checkoutTime, updatedBy, updatedAt, checkoutSource, req.student_id, req.vehicle_id, req.getCurrentDate, routeType, 0];
                                                            var updateStudentQuery = 'update student_checkins set checkout_stoppage_id = $1, checkout_latitude = $2, checkout_longitude = $3, checkout_time = $4, updated_by = $5, updated_at = $6, checkout_source = $7 where student_id = $8 and vehicle_id = $9 and created_at::date = $10 and route_type = $11 and is_deleted = $12 and checkin_time is not null';
                                                            this.sqlQuery(updateStudentQuery, updateStudentValues)
                                                              .then(res => {
                                                                  // successfully updated the data of checkout
                                                              })
                                                        }

                                                        // get student checkin id from student checkins table
                                                        var selectStudentCheckinValues = [req.student_id, req.vehicle_id, req.getCurrentDate, routeType, 0];
                                                        var selectStudentCheckinQuery = 'select student_checkin_id from student_checkins where student_id = $1 and vehicle_id = $2 and created_at::date = $3 and route_type = $4 and is_deleted = $5 order by student_checkin_id DESC LIMIT 1';
                                                        this.sqlQuery(selectStudentCheckinQuery, selectStudentCheckinValues)
                                                          .then(res => {
                                                              studentCheckinId = res.rows[0].student_checkin_id;
                                                              var deviceType;
                                                              if(res.rowCount > 0){
                                                                  tokens.forEach(function(element) {
                                                                      parents.push(element.user_id);
                                                                      deviceType = element.device_type;
                                                                      if(deviceType.toLowerCase()=='android'){
                                                                        androidTokens.push(element.device_token);
                                                                      } else{
                                                                        iosTokens.push(element.device_token);
                                                                      }
                                                                  });

                                                                  // send push notification to andriod
                                                                  if(androidTokens && androidTokens.length){
                                                                    var fcmNotification = {
                                                                      registration_ids : androidTokens,
                                                                      data : {
                                                                          'student_checkin_id' : studentCheckinId,
                                                                          'checkin_type' : notificationType
                                                                      },
                                                                      notification : {
                                                                          title : msgTitle,
                                                                          body : msgBody,
                                                                          sound : 'default'
                                                                      }
                                                                    }
                                                                    // call push notificaction method
                                                                    pushNotification.send_fcm(fcmNotification);
                                                                  }
                                                                  // send push notification to EDUCATION_DB_USERNAME
                                                                  if(iosTokens && iosTokens.length){
                                                                    var apnParameters = JSON.stringify({
                                                                        'method_type': req.action,
                                                                        'student_ios_tokens': iosTokens,
                                                                        'msg_title': msgTitle,
                                                                        'msg_body': msgBody,
                                                                        'msg_sound': 'default',
                                                                        'student_checkin_id': studentCheckinId,
                                                                        'notification_type' : notificationType
                                                                    });
                                                                    this.sendApnNotification(apnParameters, req.token);
                                                                  }

                                                                  // get unique parent and insert only row for each parent
                                                                  var uniqueValues = [...new Set(parents)];
                                                                  uniqueValues.forEach(function(element) {
                                                                    var notificaitonArrayValues = [element, notificationType, msgTitle, msgBody, studentCheckinId, 'ios', req.userAgent, req.ipAddress, req.user_id, req.user_id, req.getCurrentDate, req.school_id];
                                                                    var notificationQuery = 'insert into notifications(user_id, notification_type, title, description, payload, resource_type, user_agent, ip_address, created_by, updated_by, created_at, school_id) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING notification_id';
                                                                    dbConfig
                                                                      .query(notificationQuery, notificaitonArrayValues)
                                                                      .then(res => {
                                                                          // Notification inserted successfullly
                                                                      })
                                                                  });

                                                                  message = {
                                                                    status  : Config.SUCCESS,
                                                                    error   : Message.NOTIFICATION_SUCCESS
                                                                  }
                                                                  // publish the Channel
                                                                  pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                                                              } else {
                                                                // return if student cehckin record is not found
                                                                message = {
                                                                    status  : Config.FAILURE,
                                                                    error  : Message.STUDENT_CHECKIN_ERROR,
                                                                };
                                                                // publish the channel
                                                                pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                                                              }
                                                          })
                                                    } else {
                                                        // return if device toekn record is not found
                                                        var message = {
                                                            status  : Config.FAILURE,
                                                            error  : Message.DEVICE_TOKEN_ERROR,
                                                        };
                                                        // publish the channel
                                                        pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                                                    }
                                                })
                                          } else {
                                            // return if student route type record is not found
                                            var message = {
                                                status  : Config.FAILURE,
                                                error  : Message.STUDENT_ROUTE_TYPE_ERROR,
                                            };
                                            // publish the channel
                                            pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                                          }

                                      })
                                } else {
                                  // vehilcle stoppage name not found.
                                  message = {
                                    status  : Config.FAILURE,
                                    error   : Message.STOPPAGE_NAME_ERROR
                                  }
                                  // publish the Channel
                                  pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                                }
                            })
                      } else {
                        // vehilcle registration number not found.
                        message = {
                          status  : Config.FAILURE,
                          error   : Message.VEHICLE_REGISTRATION_ERROR
                        }
                        // publish the Channel
                        pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                      }
                  })
            } else {
                // return if student record is not found
                var message = {
                    status  : Config.FAILURE,
                    error  : Message.STUDENT_RECORD_ERROR,
                };
                // publish the channel
                pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
            }
        })
        //Receiving messages on channel
        sub.on('message', function (channel, message) {
            if(channel == 'ch_'+vehicleRouteId) {
                s.send((message), ()=>{});
            }
        });
  },

  // delay method
  delay: function(req, vehicleRouteId, s) {
      sub.subscribe('ch_'+vehicleRouteId);
      var vehicleStudentId = [];
      var studentParentId = [];
      var studentAndroidTokens = [];
      var studentIosTokens = [];
      var selectStudentVehicleRouteValues = [vehicleRouteId, 0, req.route_id, req.school_id, req.vehicle_id];
      var selectStudentVehicleRouteQuery = 'select student_id from student_vehicle_routes where vehicle_route_id = $1 and is_deleted = $2 and route_id = $3 and school_id = $4 and vehicle_id = $5';
      var todayTime = new Date().toLocaleTimeString();
      var stopPassed = [];
      var totalStoppageRecord = [];
      this.sqlQuery(selectStudentVehicleRouteQuery, selectStudentVehicleRouteValues)
        .then(res => {
            if(res.rowCount > 0){
              var vehicleResult = res.rows;
              vehicleResult.forEach(function(element){
                  vehicleStudentId.push(element.student_id);
              });
              // convert it to string
              var vehicleStudentData = vehicleStudentId.toString();
              // get result from students parents table
              var studentParentsQuery = 'select devices.device_token, devices.device_type, student_parents.user_id from devices left join student_parents on student_parents.user_id = devices.user_id where student_parents.student_id in ('+vehicleStudentData+') and student_parents.is_deleted=0 and devices.is_deleted=0';
              dbConfig
                .query(studentParentsQuery)
                .then(res => {
                    var getResults = res.rows;
                    var deviceType;
                    if(res.rowCount > 0){
                        getResults.forEach(function(element) {
                            studentParentId.push(element.user_id);
                            deviceType = element.device_type;
                            if(deviceType.toLowerCase()=='android'){
                              studentAndroidTokens.push(element.device_token);
                            } else{
                              studentIosTokens.push(element.device_token);
                            }
                        });

                        // check delay value is postive, negative and zero
                        var exactTime = this.concertDurationToExactTime(req.duration);
                        var existDelay = 0;
                        var msgBody;
                        if(req.duration > 0){
                          existDelay = 1;
                          msgBody = 'Bus has been delayed by '+exactTime+' ';
                        } else if(req.duration === 0){
                          existDelay = 2;
                          // no notificaiont', existDelay
                        } else if(req.duration < 0){
                          existDelay = 1;
                          msgBody ='Bus is running before time by '+exactTime+' ';
                        } else {
                          existDelay = 2;
                        }

                        // update delay into trip table
                        var updateDelayValues = [req.duration, req.trip_id, 0];
                        var updateDelayQuery = 'update trips set delay=$1 where trip_id=$2 and is_deleted=$3';
                        this.sqlQuery(updateDelayQuery, updateDelayValues)
                          .then(res => {
                              // updated delay time
                          })

                        // insert into trip stoppages
                        var insertTripStoppagesValues = [req.trip_id, req.current_stoppage_id, todayTime, req.school_id, 'android', req.user_id, req.userAgent, req.ipAddress, 0, req.getCurrentDate];
                        var insertTripStoppagesQuery = 'insert into trip_stoppages (trip_id, stoppage_id, reaching_time, school_id, resource_type, created_by, user_agent, ip_address, is_deleted, created_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING trip_stoppage_id';

                        // get details from trip stoppage if record already exist
                        var selectTripStoppageValue = [req.trip_id, req.current_stoppage_id, req.school_id, 0];
                        var selectTripStoppageQuery = 'select stoppage_id from trip_stoppages where trip_id = $1 and stoppage_id = $2 and school_id = $3 and is_deleted = $4';
                        this.sqlQuery(selectTripStoppageQuery, selectTripStoppageValue)
                          .then(res => {
                              if(res.rowCount > 0) {
                                // Get duplicate stoppage records
                              } else {
                                // insert into trip stoppages
                                this.sqlQuery(insertTripStoppagesQuery, insertTripStoppagesValues)
                                  .then(res => {
                                      // Inserted into trip_stoppages
                                  })
                              }
                          })

                        // get all the passed stoppges
                        this.sqlQuery('select stoppage_id from trip_stoppages where trip_id = $1 and school_id = $2 and is_deleted = $3', [req.trip_id, req.school_id, 0])
                          .then(res => {
                              if(res.rowCount > 0){
                                var getPassedStoppageData = res.rows;
                                getPassedStoppageData.forEach(function(stoppage_id){
                                      stopPassed.push(stoppage_id);
                                });
                              }
                          })

                        // get total stoppage from vehicle_route_schedules table
                        var selectTotalStoppageValue = [vehicleRouteId, req.school_id, 0];
                        var selectTotalStoppageQuery = 'select stoppage_id from vehicle_route_schedules where vehicle_route_id = $1 and school_id = $2 and is_deleted = $3';

                        this.sqlQuery(selectTotalStoppageQuery, selectTotalStoppageValue)
                          .then(res => {
                              if(res.rowCount > 0) {
                                  var getStoppageData = res.rows;
                                  getStoppageData.forEach(function(stoppage_id){
                                        totalStoppageRecord.push(stoppage_id);
                                  });
                              }
                          })

                        // get difference between stoppage_pass and total_stoppage and generate upcoming_stoppages
                        setTimeout(function(){
                            var a =  totalStoppageRecord;
                            var b =  stopPassed;

                            let valuesA = a.reduce((a,{stoppage_id}) => Object.assign(a, {[stoppage_id]:stoppage_id}), {});
                            let valuesB = b.reduce((a,{stoppage_id}) => Object.assign(a, {[stoppage_id]:stoppage_id}), {});
                            let upcomingStoppages = [...a.filter(({stoppage_id}) => !valuesB[stoppage_id]), ...b.filter(({stoppage_id}) => !valuesA[stoppage_id])];

                            var message = {
                                'action':'delay',
                                'duration':req.duration,
                                'trip_id':req.trip_id,
                                'current_stoppage_id':req.current_stoppage_id,
                                'upcoming_stoppages':upcomingStoppages
                            };
                            // publish the channel
                            pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));

                        }, 1000);


                        if(existDelay === 1){
                          // send push notification to andriod
                          if(studentAndroidTokens && studentAndroidTokens.length){
                            var fcmNotification = {
                              registration_ids : studentAndroidTokens,
                              notification : {
                                  title : 'Bus schedule',
                                  body : msgBody,
                                  sound : 'default'
                              }
                            }
                            // call push notificaction method
                            pushNotification.send_fcm(fcmNotification);
                          }

                          // send push notification to EDUCATION_DB_USERNAME
                          if(studentIosTokens && studentIosTokens.length){
                            // this.sendApnNotification(studentIosTokens, 'Bus schedule', msgBody, default);
                            var apnParameters = JSON.stringify({
                                'method_type': req.action,
                                'student_ios_tokens': studentIosTokens,
                                'msg_title': 'Bus schedule',
                                'msg_body': msgBody,
                                'msg_sound': 'default'
                            });
                            this.sendApnNotification(apnParameters, req.token);
                          }

                          // get unique parent and insert only row for each parent
                          var uniqueValues = [...new Set(studentParentId)];
                          uniqueValues.forEach(function(element) {
                            var notificaitonArrayValues = [element, 'Bus schedule', 'Bus schedule', msgBody, element, 'android', req.userAgent, req.ipAddress, req.user_id, req.user_id, req.getCurrentDate];
                            var notificationQuery = 'insert into notifications(user_id, notification_type, title, description, payload, resource_type, user_agent, ip_address, created_by, updated_by, created_at) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING notification_id';
                            dbConfig
                              .query(notificationQuery, notificaitonArrayValues)
                              .then(res => {
                                  // Notification inserted successfullly
                              })
                              .catch(e => console.error(e.stack))
                          });
                        } // end if existDelay

                    } else {
                        // Device token and parents not exist
                        var message = {
                            status  : Config.FAILURE,
                            error  : Message.DEVICE_TOKEN_ERROR,
                        };
                        // publish the channel
                        pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
                    }
                })
                .catch(e => console.error(e.stack));

            } else {
              // student vehicle details result not found
              var message = {
                  status  : Config.FAILURE,
                  error  : Message.STUDENT_VEHICLE_ROUTE_ERROR,
              };
              // publish the channel
              pub.publish('ch_'+vehicleRouteId, JSON.stringify(message));
            }
        })

        //Receiving messages on channel
        sub.on('message', function (channel, message) {
            if(channel == 'ch_'+vehicleRouteId) {
                s.send((message), ()=>{});
            }
        });
  },

  sqlQuery: function(queryType, queryValues) {
    return dbConfig
            .query(queryType, queryValues)
            .catch(e => console.error(e.stack));
  },

  concertDurationToExactTime: function(time)
  {
      var hr = ~~(time / 3600);
      var min = ~~((time % 3600) / 60);
      var sec = time % 60;
      var sec_min = "";
      if (hr > 0) {
         sec_min += "" + hrs + ":" + (min < 10 ? "0" : "");
      }
      sec_min += "" + min + ":" + (sec < 10 ? "0" : "");
      sec_min += "" + sec;
      return sec_min+ " minute.";
   },

   sendApnNotification: function(apnParameters, authToken) {
      var extServerOptionsPost = {
          host: process.env.EDUCATION_DB_HOST,
          port: '80',
          path:  process.env.EDUCATION_APP_URL+'/api/assistant/send_apn_notification',
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'authorization': 'Bearer '+authToken,
          }
      };
      var reqPost = http.request(extServerOptionsPost, function (res) {
          res.on('data', function (data) {
              process.stdout.write(data);
          });
      });

      reqPost.write(apnParameters);
      reqPost.end();
      reqPost.on('error', function (e) {
          // console.error(e);
      });
    },

}
