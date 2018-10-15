const transporter = require('./transport');
var fs = require('fs');
var handlebars = require('handlebars');

var readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};
module.exports = {
    /**
     * sendEmail
     *
     * @package                iVizon
     * @subpackage             sendEmail
     * @category               Helper function
     * @DateOfCreation         02 Jul 2018
     * @ShortDescription       This is responsible for sending email
     */

    sendEmail:function(from, to, subject, template,replacements){
        readHTMLFile('email_templates/email.html', function(err, html) {
            var template = handlebars.compile(html);
            var htmlToSend = template(replacements);
            var mailOptions = {
                from: from, // sender address
                to: to, // list of receivers
                subject: subject, // Subject line
                html: htmlToSend // html body
            }
            return transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                    //Error
                } else {

                    //Success
                }
            });
        });


    }
}
