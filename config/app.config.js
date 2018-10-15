/**
 * Config Constants
 *
 * @package                iVizon
 * @subpackage             Config Constants
 * @category               Constants
 * @DateOfCreation         14 Jun 2018
 * @ShortDescription       This is responsible for Config constants
 */

module.exports = {
    SECRET: 'Grsylp0dJX',
    SUCCESS: 1000,
    FAILURE: 5000,
    EXCEPTION:3000,
    UNAUTHENTICATE:7000,
    TOKEN_EXPIRY_TIME:'300d',
    MONGO_DB_DUPLICATE_ERROR:11000,
    HTTP_STATUS_OK:200,
    MAX_LISTENERS:0,
    PASSWORD_EXPRESSION: '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$',
    SALT_WORK_FACTOR:10,
    EMAIL_SENDER:'"Education Admin" <admin@education.com>',
    WATCHING_TIME:15,
    SITE_URL:process.env.VIZONMAPS_SITE_URL, //http://localhost:3001
    TOKEN_REQUIRED:'Token required',
    UNAUTHORIZE_CALL:'Unauthorize',
    FCM_SERVER_KEY: 'AIzaSyCwN8BR68R2qYoy8Zlnns1eMaMOIFYp5v0',
}
