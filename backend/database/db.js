const mysql = require('mysql2');

// Configurazione della connessione
// Modifica i parametri con le tue credenziali locali o di Altervista
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'calorie_tracker',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

const pool = mysql.createPool(dbConfig);

// Wrapper per usare le promise
const promisePool = pool.promise();

module.exports = promisePool;
