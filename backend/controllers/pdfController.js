const PdfPrinter = require('pdfmake');
const db = require('../database/db');
const { getDiaryData } = require('../services/diaryService');

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

    const [utenti] = await db.query('SELECT * FROM utenti WHERE id = ?', [utente_id]);
    const utente = utenti[0] || { username: 'Utente' };

    const { diario, totali } = await getDiaryData(utente_id, data);

    const bodyPasti = [];

    for (const entry of diario) {
      bodyPasti.push([{ text: entry.pasto.tipo.toUpperCase(), style: 'subheader', colSpan: 5 }, {}, {}, {}, {}]);

      if (entry.alimenti.length === 0) {
        bodyPasti.push([{ text: 'Nessun alimento', italics: true, colSpan: 5 }, {}, {}, {}, {}]);
      } else {
        for (const item of entry.alimenti) {
          const { cal, pro, car, gra, fib } = item.calcolati;
          let descCondimento = '';
          if (item.condimento_id && item.quantita_condimento_g > 0) {
            descCondimento = `\n(+ ${item.quantita_condimento_g}g ${item.condimento_nome}${item.condimento_scolato ? ' scolato' : ''})`;
          }

          bodyPasti.push([
            item.nome + descCondimento,
            `${item.quantita_cruda_g}g`,
            item.cottura,
            `${Math.round(cal)} kcal`,
            `P: ${Math.round(pro)}g, C: ${Math.round(car)}g, G: ${Math.round(gra)}g, F: ${Math.round(fib)}g`
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
            widths: ['*', '*', '*', '*', '*'],
            body: [
              ['Calorie', 'Proteine', 'Carboidrati', 'Grassi', 'Fibre'],
              [
                `${Math.round(totali.calorie)} kcal`,
                `${Math.round(totali.proteine)} g`,
                `${Math.round(totali.carboidrati)} g`,
                `${Math.round(totali.grassi)} g`,
                `${Math.round(totali.fibre)} g`
              ]
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
