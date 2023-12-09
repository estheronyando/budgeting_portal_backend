const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
};

const pool = new Pool(dbConfig);

pool
  .connect()
  .then(() => console.log('Connected Successful'))
  .catch((err) => console.error(`Connection failed! Error: ${err}`))
  .finally(() => pool.end());

module.exports={
  pool,
}