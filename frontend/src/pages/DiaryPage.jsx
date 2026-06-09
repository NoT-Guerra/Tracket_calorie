import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProgressBar from '../components/ProgressBar';

function DiaryPage({ userId }) {
  const [diario, setDiario] = useState([]);
  const [totali, setTotali] = useState({ calorie: 0, proteine: 0, carboidrati: 0, grassi: 0 });
  const [obiettivi, setObiettivi] = useState({ calorie: 2000, proteine: 50, carboidrati: 250, grassi: 65 });
  const [dataOdierna] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await axios.get(`/api/utenti/${userId}`);
        setObiettivi({
          calorie: userRes.data.obiettivo_calorie,
          proteine: userRes.data.obiettivo_proteine,
          carboidrati: userRes.data.obiettivo_carboidrati,
          grassi: userRes.data.obiettivo_grassi,
        });

        // Fetch diary
        const diaryRes = await axios.get(`/api/diario?data=${dataOdierna}&utente_id=${userId}`);
        setDiario(diaryRes.data.diario);
        setTotali(diaryRes.data.totali);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [userId, dataOdierna]);

  const handleExportPDF = () => {
    window.open(`/api/diario/pdf?data=${dataOdierna}&utente_id=${userId}`, '_blank');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Il tuo Diario ({dataOdierna})</h1>
        <button onClick={handleExportPDF} className="btn btn-secondary">Esporta PDF</button>
      </div>

      <ProgressBar totali={totali} obiettivi={obiettivi} />

      <div className="meals-container">
        {diario.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Nessun pasto registrato oggi.</p>
          </div>
        ) : (
          diario.map((p, idx) => (
            <div key={idx} className="glass-panel meal-section">
              <div className="meal-header">
                <h3>{p.pasto.tipo.toUpperCase()}</h3>
              </div>
              <div className="meal-items">
                {p.alimenti.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Nessun alimento.</p>
                ) : (
                  p.alimenti.map((a, i) => (
                    <div key={i} className="meal-item">
                      <div className="meal-item-info">
                        <h4>{a.nome} {a.condimento_id ? `(con ${a.condimento_nome})` : ''}</h4>
                        <div className="meal-item-meta">
                          {a.quantita_cruda_g}g crudo - Cottura: {a.cottura}
                        </div>
                      </div>
                      <div className="meal-item-stats">
                        <div style={{ color: 'var(--primary)' }}>{Math.round(a.calcolati.cal)} kcal</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          P:{Math.round(a.calcolati.pro)} C:{Math.round(a.calcolati.car)} G:{Math.round(a.calcolati.gra)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DiaryPage;
