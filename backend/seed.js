const fs = require('fs');
const csv = require('csv-parser');
const db = require('./database/db');

const CSV_PATH = './openfoodfacts-products.csv';
const JSON_PATH = './alimenti_base.json';

async function seedBaseFoods() {
  console.log('Seeding alimenti base...');
  if (fs.existsSync(JSON_PATH)) {
    const rawData = fs.readFileSync(JSON_PATH);
    const alimenti = JSON.parse(rawData);
    for (const al of alimenti) {
      try {
        await db.query(
          `INSERT IGNORE INTO alimenti 
           (nome, marca, foto_url, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g, fibra_100g, creato_da_utente) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
          [al.nome, al.marca, al.foto_url, al.calorie_100g, al.proteine_100g, al.carboidrati_100g, al.grassi_100g, al.fibra_100g]
        );
      } catch (err) {
        console.error(`Errore inserimento base ${al.nome}:`, err);
      }
    }
    console.log('Alimenti base inseriti con successo.');
  } else {
    console.log(`File ${JSON_PATH} non trovato, salto il seed base.`);
  }
}

async function seedOpenFoodFacts() {
  if (!fs.existsSync(CSV_PATH)) {
    console.log(`File ${CSV_PATH} non trovato. Per favore scarica il file da Open Food Facts.`);
    return;
  }
  
  console.log('Inizio parser CSV Open Food Facts...');
  let count = 0;
  let inserted = 0;

  fs.createReadStream(CSV_PATH)
    .pipe(csv({ separator: '\t' }))
    .on('data', async (row) => {
      // Per evitare di riempire troppo la memoria/DB in test, ci fermiamo dopo 1000 prodotti validi
      if (inserted >= 1000) return;

      const name = row.product_name;
      const energy = parseFloat(row.nutriments_energy_100g || row['energy-kcal_100g']);
      const proteins = parseFloat(row.nutriments_proteins_100g || row.proteins_100g);
      const carbs = parseFloat(row.nutriments_carbohydrates_100g || row.carbohydrates_100g);
      const fat = parseFloat(row.nutriments_fat_100g || row.fat_100g);
      const fiber = parseFloat(row.nutriments_fiber_100g || row.fiber_100g || 0);
      
      // Filtro prodotti con valori nutrizionali validi e nome
      if (name && !isNaN(energy) && !isNaN(proteins) && !isNaN(carbs) && !isNaN(fat)) {
        count++;
        // Usa una promise per inserire (limitando le query asincrone nel parser)
        try {
          await db.query(
            `INSERT INTO alimenti 
             (nome, marca, foto_url, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g, fibra_100g, creato_da_utente) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
            [
              name.substring(0, 100), 
              (row.brands || '').substring(0, 100), 
              (row.image_url || '').substring(0, 500), 
              Math.round(energy), 
              proteins, 
              carbs, 
              fat, 
              fiber
            ]
          );
          inserted++;
          if (inserted % 100 === 0) console.log(`Inseriti ${inserted} prodotti...`);
        } catch (err) {
          // Ignora duplicati o errori
        }
      }
    })
    .on('end', () => {
      console.log('Parser CSV completato.');
      console.log(`Totale prodotti validi trovati/inseriti: ${inserted}`);
      process.exit();
    });
}

async function run() {
  await seedBaseFoods();
  await seedOpenFoodFacts();
}

run();
