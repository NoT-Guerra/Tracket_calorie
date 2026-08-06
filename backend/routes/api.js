const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database/db');
const pdfController = require('../controllers/pdfController');

const os = require('os');

// Configurazione multer per l'upload di immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- UTENTI ---

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

// Ricerca alimenti
router.get('/alimenti', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    const searchTerm = `%${q}%`;
    const [rows] = await db.query(
      'SELECT id, nome, marca, foto_url, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g, fibra_100g, creato_da_utente FROM alimenti WHERE nome LIKE ? OR marca LIKE ? LIMIT 50',
      [searchTerm, searchTerm]
    );
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
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
    
    // Controlla se esiste già
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
    
    // Ottieni pasti
    const [pasti] = await db.query('SELECT * FROM pasti WHERE utente_id = ? AND data = ?', [utente_id, data]);
    
    const diario = [];
    let totCal = 0, totPro = 0, totCar = 0, totGra = 0, totFib = 0;
    
    for (const pasto of pasti) {
      const [alimenti] = await db.query(`
        SELECT pa.*, a.nome, a.marca, a.calorie_100g, a.proteine_100g, a.carboidrati_100g, a.grassi_100g, a.fibra_100g,
               c.nome as condimento_nome, c.calorie_100g as c_cal, c.proteine_100g as c_pro, c.carboidrati_100g as c_car, c.grassi_100g as c_gra
        FROM pasto_alimenti pa
        JOIN alimenti a ON pa.alimento_id = a.id
        LEFT JOIN condimenti c ON pa.condimento_id = c.id
        WHERE pa.pasto_id = ?
      `, [pasto.id]);
      
      const alimentiCalcolati = alimenti.map(item => {
        const factorAli = item.quantita_cruda_g / 100;
        let cal = item.calorie_100g * factorAli;
        let pro = item.proteine_100g * factorAli;
        let car = item.carboidrati_100g * factorAli;
        let gra = item.grassi_100g * factorAli;
        let fib = item.fibra_100g * factorAli;
        
        let c_cal = 0, c_pro = 0, c_car = 0, c_gra = 0;
        let cond_effettivi = item.quantita_condimento_g || 0;
        
        if (item.condimento_id && cond_effettivi > 0) {
          if (item.condimento_scolato) {
            cond_effettivi = cond_effettivi * 0.6; // 40% in meno
          }
          const factorCond = cond_effettivi / 100;
          c_cal = item.c_cal * factorCond;
          c_pro = item.c_pro * factorCond;
          c_car = item.c_car * factorCond;
          c_gra = item.c_gra * factorCond;
          
          cal += c_cal; pro += c_pro; car += c_car; gra += c_gra;
        }
        
        totCal += cal; totPro += pro; totCar += car; totGra += gra; totFib += fib;
        
        return {
          ...item,
          calcolati: { cal, pro, car, gra, fib, cond_effettivi, c_cal, c_pro, c_car, c_gra }
        };
      });
      
      diario.push({
        pasto,
        alimenti: alimentiCalcolati
      });
    }
    
    res.json({
      diario,
      totali: { calorie: totCal, proteine: totPro, carboidrati: totCar, grassi: totGra, fibre: totFib }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero del diario' });
  }
});


// PDF GENERATOR ROUTE
router.get('/diario/pdf', pdfController.generatePdf);

module.exports = router;
