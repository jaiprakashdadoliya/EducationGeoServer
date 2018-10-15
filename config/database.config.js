const { Client } = require('pg');

// var connectionString = 'postgresql://'+process.env.EDUCATION_DB_USERNAME+':'+process.env.EDUCATION_DB_PASSWORD+'@'+process.env.EDUCATION_DB_HOST+':'+process.env.EDUCATION_DB_PORT+'/'+process.env.EDUCATION_DB_DATABASE;
// const client = new Client(connectionString);
const client = new Client({
  user: process.env.EDUCATION_DB_USERNAME,
  host: process.env.EDUCATION_DB_HOST,
  database: process.env.EDUCATION_DB_DATABASE,
  password: process.env.EDUCATION_DB_PASSWORD,
  port: process.env.EDUCATION_DB_PORT,
});

client.connect((err) => {
  if (err) {
    console.error('connection error', err.stack);
  } else {
    console.log('Successfully connected to the database');
  }
});

module.exports = client;
