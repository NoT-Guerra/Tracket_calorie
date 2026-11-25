const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function importSchema() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
      dateStrings: true
    });

    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Importazione schema database in corso...');
    await connection.query(sql);

    // Assicura l'indice UNIQUE(nome, marca) anche su tabelle già esistenti (previa rimozione di eventuali duplicati)
    const dbName = process.env.DB_NAME || 'calorie_tracker';
    await connection.query(`USE \`${dbName}\``);

    const [indexes] = await connection.query(
      `SHOW INDEX FROM alimenti WHERE Key_name = 'unique_nome_marca'`
    );
    if (indexes.length === 0) {
      // Rimuove eventuali duplicati mantenendo l'ID minore prima di aggiungere la chiave univoca
      await connection.query(`
        DELETE a1 FROM alimenti a1
        INNER JOIN alimenti a2
        WHERE a1.id > a2.id AND a1.nome = a2.nome AND a1.marca = a2.marca
      `);
      await connection.query(
        `ALTER TABLE alimenti ADD UNIQUE KEY unique_nome_marca (nome, marca)`
      );
      console.log('Aggiunto vincolo UNIQUE(nome, marca) sulla tabella alimenti.');
    }

    console.log('Schema importato con successo.');
  } catch (err) {
    console.error('Errore durante l\'importazione dello schema:', err);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importSchema();
