/**
 * User Controller
 *
 * @package                iVizon
 * @subpackage             User Controller
 * @category               Controller
 * @DateOfCreation         12 Jun 2018
 * @ShortDescription       This is responsible for all user actions
 */
const path = require('path');
const Message = require(path.resolve('config/message.constant'));
const Config = require(path.resolve('config/app.config'));
process.setMaxListeners(Config.MAX_LISTENERS);//Maximum Listeners

var response={};

/**
 * @DateOfCreation        12 Jun 2018
 * @ShortDescription      This function is responsible to subscribe channel
 * @return                Response JSON jsonObj
 */
exports.doSubscribe = (locationData) => {

    //Subscribing Location Channel
    sub.subscribe('ch_'+locationData.user_id);

    response = {
        status          : Config.HTTP_STATUS_OK,
        code            : Config.SUCCESS,
        message         : Message.SUBSCRIBE_CHANNEL,
    }
    return response;
}

/**
 * @DateOfCreation        12 Jun 2018
 * @ShortDescription      This function is responsible for publish location to channel
 * @return                Response JSON jsonObj
 */
exports.doPublish = (locationData) => {
    var message = {
        user_id: locationData.user_id,
        lat:locationData.lat,
        long:locationData.long,
        b:1
    };
    pub.publish('ch_'+locationData.user_id, JSON.stringify(message));

}

/**
 * @DateOfCreation        12 Jun 2018
 * @ShortDescription      This function is responsible to unsubscribe channel
 * @return                Response JSON jsonObj
 */
exports.doUnSubscribe = (locationData) => {

    //Publish broadcast message before unsubscribe
    var message = {
        user_id: locationData.user_id,
        b:0
    };
    pub.publish('locations', JSON.stringify(message));

    //Unsubscribe user from channel
    sub.unsubscribe();
}
