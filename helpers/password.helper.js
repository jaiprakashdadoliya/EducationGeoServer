var bcrypt = require('bcrypt');

module.exports = {
    /**
     * cryptPassword
     *
     * @package                iVizon
     * @subpackage             cryptPassword
     * @category               Helper function
     * @DateOfCreation         12 Jun 2018
     * @ShortDescription       This is responsible for encrypting password
     */

    cryptPassword: function(password, callback) {
        bcrypt.genSalt(10, function(err, salt) {
            if (err)
                return callback(err);

            bcrypt.hash(password, salt, function(err, hash) {
                return callback(err, hash);
            });
        });
    },

    /**
     * comparePassword
     *
     * @package                iVizon
     * @subpackage             comparePassword
     * @category               Helper function
     * @DateOfCreation         12 Jun 2018
     * @ShortDescription       This is responsible for comparing password
     */

    comparePassword: function(plainPass, hashword, callback) {
        bcrypt.compare(plainPass, hashword, function(err, isPasswordMatch) {
            return err == null ?
                callback(null, isPasswordMatch) :
                callback(err);
        });
    }
}
