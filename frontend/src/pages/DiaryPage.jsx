import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProgressBar from '../components/ProgressBar';

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDateString(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  dateObj.setDate(dateObj.getDate() + deltaDays);
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}

function DiaryPage({ userId, selectedDate, setSelectedDate }) {
  const [diario, setDiario] = useState([]);
  const [totali, setTotali] = useState({ calorie: 0, proteine: 0, carboidrati: 0, grassi: 0, fibre: 0 });
  const [obiettivi, setObiettivi] = useState({ calorie: 2000, proteine: 50, carboidrati: 250, grassi: 65, fibre: 25 });

  // Stato per la modifica in linea della quantità di un alimento già inserito
  const [editingItemId, setEditingItemId] = useState(null);
  const [editQuantitaCruda, setEditQuantitaCruda] = useState('');
  const [editQuantitaCondimento, setEditQuantitaCondimento] = useState('');

  const dataCorrente = selectedDate || getTodayString();

  const fetchData = useCallback(async () => {
    try {
      const [userRes, diaryRes] = await Promise.all([
        axios.get(`/api/utenti/${userId}`),
        axios.get(`/api/diario?data=${dataCorrente}&utente_id=${userId}`)
      ]);

      setObiettivi({
        calorie: userRes.data.obiettivo_calorie,
        proteine: userRes.data.obiettivo_proteine,
        carboidrati: userRes.data.obiettivo_carboidrati,
        grassi: userRes.data.obiettivo_grassi,
        fibre: userRes.data.obiettivo_fibre ?? 25
      });

      setDiario(diaryRes.data.diario);
      setTotali(diaryRes.data.totali);
    } catch (err) {
      console.error(err);
    }
  }, [userId, dataCorrente]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPDF = () => {
    window.open(`/api/diario/pdf?data=${dataCorrente}&utente_id=${userId}`, '_blank');
  };

  const handleDeleteFood = async (pastoAlimentoId) => {
    if (!window.confirm('Sei sicuro di voler rimuovere questo alimento?')) return;
    try {
      await axios.delete(`/api/pasto_alimenti/${pastoAlimentoId}`);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Errore durante la rimozione dell\'alimento');
    }
  };

  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditQuantitaCruda(String(item.quantita_cruda_g));
    setEditQuantitaCondimento(item.quantita_condimento_g ? String(item.quantita_condimento_g) : '');
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditQuantitaCruda('');
    setEditQuantitaCondimento('');
  };

  const handleSaveEdit = async (item) => {
    const newQta = parseFloat(editQuantitaCruda);
    if (!newQta || newQta <= 0) {
      alert('Inserisci una quantità valida maggiore di 0');
      return;
    }

    const payload = {
      quantita_cruda_g: Math.round(newQta)
    };

    if (item.condimento_id) {
      const condQta = parseFloat(editQuantitaCondimento);
      payload.quantita_condimento_g = !isNaN(condQta) && condQta >= 0 ? Math.round(condQta) : 0;
    }

    try {
      await axios.put(`/api/pasto_alimenti/${item.id}`, payload);
      cancelEditing();
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Errore durante l\'aggiornamento della quantità');
    }
  };

  const isToday = dataCorrente === getTodayString();

  return (
    <div className="animate-fade-in">
      <div className="diary-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Il tuo Diario</h1>
          <div className="date-navigator">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedDate(shiftDateString(dataCorrente, -1))}
              title="Giorno precedente"
            >
              &larr; Prec
            </button>
            <input
              type="date"
              className="form-control date-picker-input"
              value={dataCorrente}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedDate(shiftDateString(dataCorrente, 1))}
              title="Giorno successivo"
            >
              Succ &rarr;
            </button>
            {!isToday && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setSelectedDate(getTodayString())}
              >
                Oggi
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/obiettivi" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Modifica Obiettivi
          </Link>
          <button onClick={handleExportPDF} className="btn btn-secondary">
            Esporta PDF
          </button>
        </div>
      </div>

      <ProgressBar totali={totali} obiettivi={obiettivi} />

      <div className="meals-container">
        {diario.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Nessun pasto registrato per il {dataCorrente}.
            </p>
            <Link to="/search" className="btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
              + Aggiungi Alimento
            </Link>
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
                  p.alimenti.map((a) => {
                    const isEditing = editingItemId === a.id;
                    return (
                      <div key={a.id} className="meal-item">
                        <div className="meal-item-info">
                          <h4>
                            {a.nome}{' '}
                            {a.condimento_id
                              ? `(con ${a.quantita_condimento_g || 0}g ${a.condimento_nome}${a.condimento_scolato ? ' scolato' : ''})`
                              : ''}
                          </h4>
                          {isEditing ? (
                            <div className="inline-edit-row">
                              <label>
                                Crudo (g):
                                <input
                                  type="number"
                                  min="1"
                                  className="form-control inline-edit-input"
                                  value={editQuantitaCruda}
                                  onChange={(e) => setEditQuantitaCruda(e.target.value)}
                                />
                              </label>
                              {a.condimento_id && (
                                <label>
                                  Condimento (g):
                                  <input
                                    type="number"
                                    min="0"
                                    className="form-control inline-edit-input"
                                    value={editQuantitaCondimento}
                                    onChange={(e) => setEditQuantitaCondimento(e.target.value)}
                                  />
                                </label>
                              )}
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => handleSaveEdit(a)}
                              >
                                Salva
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={cancelEditing}
                              >
                                Annulla
                              </button>
                            </div>
                          ) : (
                            <div className="meal-item-meta">
                              {a.quantita_cruda_g}g crudo - Cottura: {a.cottura}
                            </div>
                          )}
                        </div>
                        <div className="meal-item-stats flex-between" style={{ gap: '1rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                              {Math.round(a.calcolati.cal)} kcal
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              P:{Math.round(a.calcolati.pro)}g C:{Math.round(a.calcolati.car)}g G:{Math.round(a.calcolati.gra)}g F:{Math.round(a.calcolati.fib)}g
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {!isEditing && (
                              <button
                                onClick={() => startEditing(a)}
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                                title="Modifica quantità"
                              >
                                Modifica
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFood(a.id)}
                              className="btn btn-secondary"
                              style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444'
                              }}
                              title="Rimuovi alimento"
                            >
                              X
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
