const PdfPrinter = require('pdfmake');
const db = require('../database/db');

// Font predefiniti per pdfmake
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

exports.generatePdf = async (req, res) => {
  try {
    const { data, utente_id } = req.query;
    
    // Recupera dati utente
    const [utenti] = await db.query('SELECT * FROM utenti WHERE id = ?', [utente_id]);
    const utente = utenti[0] || { username: 'Utente' };
    
    // Recupera dati diario in modo simile alla rotta /diario
    const [pasti] = await db.query('SELECT * FROM pasti WHERE utente_id = ? AND data = ?', [utente_id, data]);
    
    let totCal = 0, totPro = 0, totCar = 0, totGra = 0;
    
    const bodyPasti = [];
    
    for (const pasto of pasti) {
      bodyPasti.push([{ text: pasto.tipo.toUpperCase(), style: 'subheader', colSpan: 5 }, {}, {}, {}, {}]);
      
      const [alimenti] = await db.query(`
        SELECT pa.*, a.nome, a.calorie_100g, a.proteine_100g, a.carboidrati_100g, a.grassi_100g,
               c.nome as cond_nome, c.calorie_100g as c_cal
        FROM pasto_alimenti pa
        JOIN alimenti a ON pa.alimento_id = a.id
        LEFT JOIN condimenti c ON pa.condimento_id = c.id
        WHERE pa.pasto_id = ?
      `, [pasto.id]);
      
      if (alimenti.length === 0) {
        bodyPasti.push([{ text: 'Nessun alimento', italics: true, colSpan: 5 }, {}, {}, {}, {}]);
      } else {
        for (const item of alimenti) {
          const factorAli = item.quantita_cruda_g / 100;
          let cal = item.calorie_100g * factorAli;
          
          let descCondimento = '';
          if (item.condimento_id && item.quantita_condimento_g > 0) {
            let cond_effettivi = item.quantita_condimento_g;
            if (item.condimento_scolato) cond_effettivi *= 0.6;
            cal += (item.c_cal * cond_effettivi / 100);
            descCondimento = `\n(+ ${item.quantita_condimento_g}g ${item.cond_nome}${item.condimento_scolato ? ' scolato' : ''})`;
          }
          
          totCal += cal;
          totPro += item.proteine_100g * factorAli;
          totCar += item.carboidrati_100g * factorAli;
          totGra += item.grassi_100g * factorAli;
          
          bodyPasti.push([
            item.nome + descCondimento,
            `${item.quantita_cruda_g}g`,
            item.cottura,
            `${Math.round(cal)} kcal`,
            `P: ${Math.round(item.proteine_100g * factorAli)}g, C: ${Math.round(item.carboidrati_100g * factorAli)}g, G: ${Math.round(item.grassi_100g * factorAli)}g`
          ]);
        }
      }
    }
    
    if (bodyPasti.length === 0) {
      bodyPasti.push([{ text: 'Nessun pasto registrato in questa data.', colSpan: 5 }, {}, {}, {}, {}]);
    }

    const docDefinition = {
      content: [
        { text: `Diario Alimentare - ${utente.username}`, style: 'header' },
        { text: `Data: ${data}`, style: 'subheader', margin: [0, 0, 0, 20] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              ['Alimento', 'Q.tà cruda', 'Cottura', 'Calorie', 'Macro'],
              ...bodyPasti
            ]
          }
        },
        { text: 'Riepilogo Totale', style: 'header', margin: [0, 20, 0, 10] },
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              ['Calorie', 'Proteine', 'Carboidrati', 'Grassi'],
              [`${Math.round(totCal)} kcal`, `${Math.round(totPro)} g`, `${Math.round(totCar)} g`, `${Math.round(totGra)} g`]
            ]
          }
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
          fillColor: '#f2f2f2'
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=diario-${data}.pdf`);
    
    pdfDoc.pipe(res);
    pdfDoc.end();
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Errore nella generazione del PDF');
  }
};
