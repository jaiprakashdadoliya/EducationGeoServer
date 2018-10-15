var mailer = require('nodemailer');
var mailConfig = {
    host: process.env.VIZONMAPS_MAIL_HOST,
    port: process.env.VIZONMAPS_MAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.VIZONMAPS_MAIL_USERNAME,
        pass: process.env.VIZONMAPS_MAIL_PASSWORD
    }
};

var transporter = mailer.createTransport(mailConfig);

module.exports = transporter;