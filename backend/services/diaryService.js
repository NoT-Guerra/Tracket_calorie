const db = require('../database/db');

/**
 * Calcola i macronutrienti (inclusi quelli del condimento con eventuale scolo al 40%)
 * per un singolo record pasto_alimenti unito ad alimenti e condimenti.
 */
function calculateItemNutrients(item) {
  const quantitaCruda = Number(item.quantita_cruda_g) || 0;
  const factorAli = quantitaCruda / 100;

  let cal = Number(item.calorie_100g || 0) * factorAli;
  let pro = Number(item.proteine_100g || 0) * factorAli;
  let car = Number(item.carboidrati_100g || 0) * factorAli;
  let gra = Number(item.grassi_100g || 0) * factorAli;
  let fib = Number(item.fibra_100g || 0) * factorAli;

  let c_cal = 0, c_pro = 0, c_car = 0, c_gra = 0;
  let cond_effettivi = Number(item.quantita_condimento_g) || 0;

  if (item.condimento_id && cond_effettivi > 0) {
    if (item.condimento_scolato) {
      cond_effettivi = cond_effettivi * 0.6; // 40% in meno
    }
    const factorCond = cond_effettivi / 100;
    c_cal = Number(item.c_cal || 0) * factorCond;
    c_pro = Number(item.c_pro || 0) * factorCond;
    c_car = Number(item.c_car || 0) * factorCond;
    c_gra = Number(item.c_gra || 0) * factorCond;

    cal += c_cal;
    pro += c_pro;
    car += c_car;
    gra += c_gra;
  }

  return {
    cal,
    pro,
    car,
    gra,
    fib,
    cond_effettivi,
    c_cal,
    c_pro,
    c_car,
    c_gra
  };
}

/**
 * Recupera i pasti e gli alimenti di un utente per una data specifica,
 * restituendo la struttura completa con i valori calcolati per singolo alimento
 * e i totali giornalieri (inclusi i macro dei condimenti).
 */
async function getDiaryData(utente_id, data) {
  const [pasti] = await db.query(
    'SELECT * FROM pasti WHERE utente_id = ? AND data = ? ORDER BY FIELD(tipo, "colazione", "pranzo", "spuntino", "cena")',
    [utente_id, data]
  );

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
      ORDER BY pa.id ASC
    `, [pasto.id]);

    const alimentiCalcolati = alimenti.map((item) => {
      const calcolati = calculateItemNutrients(item);
      totCal += calcolati.cal;
      totPro += calcolati.pro;
      totCar += calcolati.car;
      totGra += calcolati.gra;
      totFib += calcolati.fib;

      return {
        ...item,
        calcolati
      };
    });

    diario.push({
      pasto,
      alimenti: alimentiCalcolati
    });
  }

  return {
    diario,
    totali: {
      calorie: totCal,
      proteine: totPro,
      carboidrati: totCar,
      grassi: totGra,
      fibre: totFib
    }
  };
}

module.exports = {
  calculateItemNutrients,
  getDiaryData
};
