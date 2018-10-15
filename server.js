const express = require('express');
const bodyParser = require('body-parser');
const expressWs = require('express-ws');
const path = require('path');
// create express app
const app = express();
const ws = expressWs(app);

const redis = require('redis');
const sub = redis.createClient();
const pub = redis.createClient();
const { check, validationResult } = require('express-validator/check');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

// Configuring the database
const dbConfig = require('./config/database.config.js');
const appConfig = require('./config/app.config.js');

const common = require('./helpers/common.helper');
const Config = require('./config/app.config');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ws.html'));
});

//serve pubic images, css and js files
app.use('/public', express.static('public'))
app.use('/uploads', express.static('uploads'))

require('./app/routes/user.routes.js')(app);

// Listing to port
app.listen(process.env.EDUCATION_NODE_PORT, process.env.EDUCATION_IP,function(){
    console.log("Listing to port " + process.env.EDUCATION_NODE_PORT+' and IP ' + process.env.EDUCATION_IP);
})

process.on('unhandledRejection', function(reason, promise) {
    console.log(promise);
});

//Clearing Redis data
sub.flushdb( function (err, succeeded) {
    console.log(succeeded); // will be true if successfull.
});

//Clearing Tile38 data
// tileClient.flushdb(function (err, succeeded){
//     console.log(succeeded); // will be true if successfull
// })
