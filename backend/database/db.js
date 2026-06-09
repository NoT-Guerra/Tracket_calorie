const mysql = require('mysql2');

// Configurazione della connessione
// Modifica i parametri con le tue credenziali locali o di Altervista
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Inserisci la tua password
  database: 'calorie_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Wrapper per usare le promise
const promisePool = pool.promise();

module.exports = promisePool;
