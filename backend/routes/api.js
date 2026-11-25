const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database/db');
const pdfController = require('../controllers/pdfController');
const { getDiaryData } = require('../services/diaryService');

// Configurazione multer per l'upload di immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Helper: Ricerca online su Open Food Facts e salvataggio in cache nel DB locale
async function searchAndCacheOpenFoodFacts(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,product_name_it,brands,image_url,nutriments`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CalorieTrackerLocal/1.0 (https://localhost)'
      }
    });
    if (!response.ok) return [];

    const data = await response.json();
    const products = Array.isArray(data.products) ? data.products : [];
    const validItems = [];

    for (const prod of products) {
      const rawName = (prod.product_name_it || prod.product_name || '').trim();
      const nutriments = prod.nutriments || {};
      const energy = parseFloat(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal']);
      const proteins = parseFloat(nutriments.proteins_100g);
      const carbs = parseFloat(nutriments.carbohydrates_100g);
      const fat = parseFloat(nutriments.fat_100g);
      const fiber = parseFloat(nutriments.fiber_100g || 0);

      if (
        rawName &&
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
        validItems.push({
          nome: rawName.substring(0, 100),
          marca: String(prod.brands || '').trim().substring(0, 100),
          foto_url: String(prod.image_url || '').trim().substring(0, 500),
          calorie_100g: Math.round(energy),
          proteine_100g: Math.min(999.9, Math.max(0, proteins)),
          carboidrati_100g: Math.min(999.9, Math.max(0, carbs)),
          grassi_100g: Math.min(999.9, Math.max(0, fat)),
          fibra_100g: isNaN(fiber) ? 0 : Math.min(999.9, Math.max(0, fiber))
        });
      }
    }

    for (const item of validItems) {
      try {
        await db.query(
          `INSERT INTO alimenti
           (nome, marca, foto_url, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g, fibra_100g, creato_da_utente)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)
           ON DUPLICATE KEY UPDATE
             foto_url = IF(foto_url = '' AND VALUES(foto_url) != '', VALUES(foto_url), foto_url)`,
          [
            item.nome,
            item.marca,
            item.foto_url,
            item.calorie_100g,
            item.proteine_100g,
            item.carboidrati_100g,
            item.grassi_100g,
            item.fibra_100g
          ]
        );
      } catch (dbErr) {
        // Ignora eventuali errori su singolo prodotto
      }
    }

    return validItems;
  } catch (err) {
    console.warn('Ricerca online Open Food Facts non disponibile o in timeout:', err.message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// --- UTENTI ---

// Ottieni lista di tutti gli utenti
router.get('/utenti', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM utenti ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero della lista utenti' });
  }
});

// Crea un nuovo utente
router.post('/utenti', async (req, res) => {
  try {
    const {
      username,
      obiettivo_calorie = 2000,
      obiettivo_proteine = 100,
      obiettivo_carboidrati = 200,
      obiettivo_grassi = 60,
      obiettivo_fibre = 25
    } = req.body;

    if (!username || !String(username).trim()) {
      return res.status(400).json({ error: 'Lo username è obbligatorio' });
    }

    const [result] = await db.query(
      `INSERT INTO utenti (username, obiettivo_calorie, obiettivo_proteine, obiettivo_carboidrati, obiettivo_grassi, obiettivo_fibre)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [String(username).trim(), obiettivo_calorie, obiettivo_proteine, obiettivo_carboidrati, obiettivo_grassi, obiettivo_fibre]
    );

    const [rows] = await db.query('SELECT * FROM utenti WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella creazione utente' });
  }
});

// Aggiorna obiettivi utente
router.put('/utenti/:id/obiettivi', async (req, res) => {
  try {
    const { id } = req.params;
    const { obiettivo_calorie, obiettivo_proteine, obiettivo_carboidrati, obiettivo_grassi, obiettivo_fibre } = req.body;

    await db.query(
      `UPDATE utenti SET 
       obiettivo_calorie = ?, obiettivo_proteine = ?, obiettivo_carboidrati = ?, obiettivo_grassi = ?, obiettivo_fibre = ?
       WHERE id = ?`,
      [obiettivo_calorie, obiettivo_proteine, obiettivo_carboidrati, obiettivo_grassi, obiettivo_fibre, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento degli obiettivi' });
  }
});

// Ottieni info utente
router.get('/utenti/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM utenti WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero utente' });
  }
});


// --- ALIMENTI ---

// Ricerca alimenti (DB locale + fallback/forzatura online Open Food Facts con salvataggio in cache)
router.get('/alimenti', async (req, res) => {
  try {
    const { q, online } = req.query;
    if (!q || !String(q).trim()) return res.json([]);

    const trimmedQuery = String(q).trim();
    const searchTerm = `%${trimmedQuery}%`;

    const queryLocal = async () => {
      const [rows] = await db.query(
        `SELECT id, nome, marca, foto_url, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g, fibra_100g, creato_da_utente
         FROM alimenti
         WHERE nome LIKE ? OR marca LIKE ?
         ORDER BY (nome LIKE ?) DESC, nome ASC
         LIMIT 50`,
        [searchTerm, searchTerm, `${trimmedQuery}%`]
      );
      return rows;
    };

    let rows = await queryLocal();

    if (rows.length === 0 || online === '1' || online === 'true') {
      await searchAndCacheOpenFoodFacts(trimmedQuery);
      rows = await queryLocal();
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella ricerca alimenti' });
  }
});

// Dettaglio alimento
router.get('/alimenti/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM alimenti WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Alimento non trovato' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dettaglio alimento' });
  }
});

// Crea alimento custom
router.post('/alimenti', upload.single('immagine'), async (req, res) => {
  try {
    const { nome, marca, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g, fibra_100g } = req.body;
    let foto_url = '';

    if (req.file) {
      foto_url = `/public/uploads/${req.file.filename}`;
    }

    const [result] = await db.query(
      `INSERT INTO alimenti 
       (nome, marca, foto_url, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g, fibra_100g, creato_da_utente) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         foto_url = IF(VALUES(foto_url) != '', VALUES(foto_url), foto_url),
         calorie_100g = VALUES(calorie_100g),
         proteine_100g = VALUES(proteine_100g),
         carboidrati_100g = VALUES(carboidrati_100g),
         grassi_100g = VALUES(grassi_100g),
         fibra_100g = VALUES(fibra_100g),
         id = LAST_INSERT_ID(id)`,
      [nome, marca || '', foto_url, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g, fibra_100g || 0]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella creazione dell\'alimento' });
  }
});


// --- CONDIMENTI ---

router.get('/condimenti', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM condimenti');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero condimenti' });
  }
});


// --- PASTI ---

// Crea un nuovo pasto o restituisce quello esistente per data/tipo/utente
router.post('/pasti', async (req, res) => {
  try {
    const { utente_id, data, tipo } = req.body;

    const [existing] = await db.query(
      'SELECT id FROM pasti WHERE utente_id = ? AND data = ? AND tipo = ?',
      [utente_id, data, tipo]
    );

    if (existing.length > 0) {
      return res.json({ id: existing[0].id });
    }

    const [result] = await db.query(
      'INSERT INTO pasti (utente_id, data, tipo) VALUES (?, ?, ?)',
      [utente_id, data, tipo]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella creazione del pasto' });
  }
});

// Aggiungi alimento al pasto
router.post('/pasti/:id/alimenti', async (req, res) => {
  try {
    const pasto_id = req.params.id;
    const { alimento_id, quantita_cruda_g, cottura, condimento_id, quantita_condimento_g, condimento_scolato } = req.body;

    await db.query(
      `INSERT INTO pasto_alimenti 
       (pasto_id, alimento_id, quantita_cruda_g, cottura, condimento_id, quantita_condimento_g, condimento_scolato) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pasto_id, alimento_id, quantita_cruda_g, cottura, condimento_id || null, quantita_condimento_g || null, condimento_scolato ? 1 : 0]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'aggiunta dell\'alimento al pasto' });
  }
});

// Modifica quantità (e opzionalmente condimento/cottura) di un alimento già inserito nel pasto
router.put('/pasto_alimenti/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantita_cruda_g, quantita_condimento_g, cottura, condimento_id, condimento_scolato } = req.body;

    const [existingRows] = await db.query('SELECT * FROM pasto_alimenti WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Elemento non trovato' });
    }
    const current = existingRows[0];

    const newQuantitaCruda = quantita_cruda_g !== undefined ? quantita_cruda_g : current.quantita_cruda_g;
    const newQuantitaCond = quantita_condimento_g !== undefined ? quantita_condimento_g : current.quantita_condimento_g;
    const newCottura = cottura !== undefined ? cottura : current.cottura;
    const newCondId = condimento_id !== undefined ? condimento_id : current.condimento_id;
    const newScolato = condimento_scolato !== undefined ? (condimento_scolato ? 1 : 0) : current.condimento_scolato;

    await db.query(
      `UPDATE pasto_alimenti
       SET quantita_cruda_g = ?, quantita_condimento_g = ?, cottura = ?, condimento_id = ?, condimento_scolato = ?
       WHERE id = ?`,
      [newQuantitaCruda, newQuantitaCond, newCottura, newCondId, newScolato, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'alimento nel pasto' });
  }
});

// Rimuovi alimento dal pasto
router.delete('/pasto_alimenti/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM pasto_alimenti WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella rimozione dell\'alimento dal pasto' });
  }
});


// --- DIARIO ---

router.get('/diario', async (req, res) => {
  try {
    const { data, utente_id } = req.query;
    const result = await getDiaryData(utente_id, data);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero del diario' });
  }
});


// PDF GENERATOR ROUTE
router.get('/diario/pdf', pdfController.generatePdf);

module.exports = router;
