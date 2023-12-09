const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const userSchema = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    fname VARCHAR(255) NOT NULL,
    lname VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone BIGINT UNIQUE NOT NULL,
    gender VARCHAR(255),
    email VARCHAR(255),
    tokens JSONB DEFAULT '[]'::JSONB
  );

  CREATE INDEX IF NOT EXISTS idx_tokens ON users USING gin(tokens);

  CREATE TABLE IF NOT EXISTS user_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL
  );
`;

// Execute the user schema
pool.query(userSchema)
  .then(() => console.log('User schema created successfully'))
  .catch(err => console.error(`Error creating user schema: ${err}`));

const createUser = async (fname, lname, password, phone, gender, email) => {
  const hashedPassword = await bcrypt.hash(password, 12);

  const insertUserQuery = `
    INSERT INTO users (fname, lname, password, phone, gender, email)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id;
  `;

  const values = [fname, lname, hashedPassword, phone, gender, email];

  try {
    const result = await pool.query(insertUserQuery, values);
    return result.rows[0].id;
  } catch (error) {
    throw error;
  }
};

const generateAuthToken = async (userId) => {
  try {
    const token = jwt.sign({ _id: userId.toString() }, process.env.SECRET_KEY);

    const insertTokenQuery = `
      INSERT INTO user_tokens (user_id, token)
      VALUES ($1, $2);
    `;

    const values = [userId, token];

    await pool.query(insertTokenQuery, values);

    return token;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser,
  generateAuthToken,
  pool, // You can use this pool for other database operations
};