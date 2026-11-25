const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('./database/db');

const CSV_PATH = path.join(__dirname, 'openfoodfacts-products.csv');
const JSON_PATH = path.join(__dirname, 'alimenti_base.json');
const BATCH_SIZE = 50;
const MAX_OFF_PRODUCTS = 1000;

async function insertBatch(batch) {
  if (batch.length === 0) return 0;
  const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, FALSE)').join(', ');
  const values = [];
  for (const item of batch) {
    values.push(
      item.nome,
      item.marca,
      item.foto_url,
      item.calorie_100g,
      item.proteine_100g,
      item.carboidrati_100g,
      item.grassi_100g,
      item.fibra_100g
    );
  }
  await db.query(
    `INSERT INTO alimenti 
     (nome, marca, foto_url, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g, fibra_100g, creato_da_utente) 
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       calorie_100g = VALUES(calorie_100g),
       proteine_100g = VALUES(proteine_100g),
       carboidrati_100g = VALUES(carboidrati_100g),
       grassi_100g = VALUES(grassi_100g),
       fibra_100g = VALUES(fibra_100g)`,
    values
  );
  return batch.length;
}

async function seedBaseFoods() {
  console.log('Seeding alimenti base...');
  if (!fs.existsSync(JSON_PATH)) {
    console.log(`File ${JSON_PATH} non trovato, salto il seed base.`);
    return;
  }

  const rawData = fs.readFileSync(JSON_PATH, 'utf8');
  const alimenti = JSON.parse(rawData);

  for (let i = 0; i < alimenti.length; i += BATCH_SIZE) {
    const chunk = alimenti.slice(i, i + BATCH_SIZE).map((al) => ({
      nome: String(al.nome || '').substring(0, 100),
      marca: String(al.marca || 'Generico').substring(0, 100),
      foto_url: String(al.foto_url || '').substring(0, 500),
      calorie_100g: Math.round(Number(al.calorie_100g) || 0),
      proteine_100g: Number(al.proteine_100g) || 0,
      carboidrati_100g: Number(al.carboidrati_100g) || 0,
      grassi_100g: Number(al.grassi_100g) || 0,
      fibra_100g: Number(al.fibra_100g) || 0
    }));
    try {
      await insertBatch(chunk);
    } catch (err) {
      console.error('Errore inserimento blocco alimenti base:', err);
    }
  }
  console.log(`Alimenti base inseriti/aggiornati con successo (${alimenti.length} voci).`);
}

async function seedOpenFoodFacts() {
  if (!fs.existsSync(CSV_PATH)) {
    console.log(`File CSV Open Food Facts (${path.basename(CSV_PATH)}) non presente: salto l'importazione da CSV (verrà usata la ricerca online automatica su Open Food Facts).`);
    return;
  }

  console.log('Inizio lettura e filtro CSV Open Food Facts (solo prodotti con countries_tags contenente italy)...');
  let inserted = 0;
  let batch = [];

  const fileStream = fs.createReadStream(CSV_PATH);
  const csvStream = fileStream.pipe(csv({ separator: '\t' }));

  try {
    for await (const row of csvStream) {
      if (inserted >= MAX_OFF_PRODUCTS) {
        fileStream.destroy();
        break;
      }

      const countriesTags = String(row.countries_tags || '').toLowerCase();
      if (!countriesTags.includes('italy')) {
        continue;
      }

      const name = (row.product_name_it || row.product_name || '').trim();
      const energy = parseFloat(row['energy-kcal_100g'] || row.nutriments_energy_100g);
      const proteins = parseFloat(row.proteins_100g || row.nutriments_proteins_100g);
      const carbs = parseFloat(row.carbohydrates_100g || row.nutriments_carbohydrates_100g);
      const fat = parseFloat(row.fat_100g || row.nutriments_fat_100g);
      const fiber = parseFloat(row.fiber_100g || row.nutriments_fiber_100g || 0);

      if (
        name &&
        !isNaN(energy) &&
        !isNaN(proteins) &&
        !isNaN(carbs) &&
        !isNaN(fat) &&
        energy >= 0 &&
        energy <= 1000 &&
        proteins >= 0 &&
        proteins <= 100 &&
        carbs >= 0 &&
        carbs <= 100 &&
        fat >= 0 &&
        fat <= 100
      ) {
        batch.push({
          nome: name.substring(0, 100),
          marca: String(row.brands || '').trim().substring(0, 100),
          foto_url: String(row.image_url || '').trim().substring(0, 500),
          calorie_100g: Math.round(energy),
          proteine_100g: Math.min(999.9, Math.max(0, proteins)),
          carboidrati_100g: Math.min(999.9, Math.max(0, carbs)),
          grassi_100g: Math.min(999.9, Math.max(0, fat)),
          fibra_100g: isNaN(fiber) ? 0 : Math.min(999.9, Math.max(0, fiber))
        });

        if (batch.length >= BATCH_SIZE) {
          await insertBatch(batch);
          inserted += batch.length;
          batch = [];
          if (inserted % 100 === 0) {
            console.log(`Inseriti ${inserted} prodotti da CSV...`);
          }
        }
      }
    }

    if (batch.length > 0) {
      await insertBatch(batch);
      inserted += batch.length;
    }

    console.log(`Parser CSV completato. Totale prodotti validi inseriti: ${inserted}`);
  } catch (err) {
    console.error('Errore durante il parsing del CSV:', err);
  }
}

async function run() {
  try {
    await seedBaseFoods();
    await seedOpenFoodFacts();
  } catch (err) {
    console.error('Errore durante il seed:', err);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

run();
