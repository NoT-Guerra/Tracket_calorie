const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

async function importSchema() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Importing schema...');
    await connection.query(sql);
    console.log('Schema imported successfully.');
    
    await connection.end();
  } catch (err) {
    console.error('Error importing schema:', err);
  }
}

importSchema();
