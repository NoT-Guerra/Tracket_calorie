import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function FoodDetail({ userId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alimento, setAlimento] = useState(null);
  const [condimenti, setCondimenti] = useState([]);
  
  // Form State
  const [quantitaCruda, setQuantitaCruda] = useState('');
  const [tipoPasto, setTipoPasto] = useState('pranzo');
  const [cottura, setCottura] = useState('crudo');
  const [condimentoId, setCondimentoId] = useState('');
  const [quantitaCondimento, setQuantitaCondimento] = useState('');
  const [scolato, setScolato] = useState(false);

  useEffect(() => {
    const fetchDati = async () => {
      try {
        const resAlimento = await axios.get(`/api/alimenti/${id}`);
        setAlimento(resAlimento.data);
        
        const resCondimenti = await axios.get('/api/condimenti');
        setCondimenti(resCondimenti.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDati();
  }, [id]);

  if (!alimento) return <div className="app-container" style={{padding: '2rem'}}>Caricamento...</div>;

  const showsCondimenti = cottura === 'in padella' || cottura === 'fritto';

  // Calcolo in tempo reale
  let calTot = 0, proTot = 0, carTot = 0, graTot = 0;
  const quantitaNum = parseFloat(quantitaCruda) || 0;
  
  if (quantitaNum > 0) {
    const factor = quantitaNum / 100;
    calTot = alimento.calorie_100g * factor;
    proTot = alimento.proteine_100g * factor;
    carTot = alimento.carboidrati_100g * factor;
    graTot = alimento.grassi_100g * factor;
    
    if (showsCondimenti && condimentoId && parseFloat(quantitaCondimento) > 0) {
      const condimento = condimenti.find(c => c.id === parseInt(condimentoId));
      if (condimento) {
        let condQta = parseFloat(quantitaCondimento);
        if (scolato) condQta *= 0.6; // Meno 40%
        
        const condFactor = condQta / 100;
        calTot += condimento.calorie_100g * condFactor;
        proTot += condimento.proteine_100g * condFactor;
        carTot += condimento.carboidrati_100g * condFactor;
        graTot += condimento.grassi_100g * condFactor;
      }
    }
  }

  const handleSalva = async (e) => {
    e.preventDefault();
    if (quantitaNum <= 0) return;

    try {
      // 1. Crea o ottieni pasto
      const d = new Date();
      const dataOdierna = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      
      const resPasto = await axios.post('/api/pasti', {
        utente_id: userId,
        data: dataOdierna,
        tipo: tipoPasto
      });
      
      const pasto_id = resPasto.data.id;
      
      // 2. Aggiungi alimento al pasto
      await axios.post(`/api/pasti/${pasto_id}/alimenti`, {
        alimento_id: alimento.id,
        quantita_cruda_g: quantitaNum,
        cottura: cottura,
        condimento_id: showsCondimenti && condimentoId ? parseInt(condimentoId) : null,
        quantita_condimento_g: showsCondimenti && quantitaCondimento ? parseFloat(quantitaCondimento) : null,
        condimento_scolato: scolato
      });
      
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Errore nel salvataggio');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>{alimento.nome}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Marca: {alimento.marca || 'Generico'} - Valori per 100g: {alimento.calorie_100g} kcal</p>
        
        <form onSubmit={handleSalva}>
          <div className="form-group">
            <label>Tipo di Pasto</label>
            <select className="form-control" value={tipoPasto} onChange={e => setTipoPasto(e.target.value)}>
              <option value="colazione">Colazione</option>
              <option value="pranzo">Pranzo</option>
              <option value="spuntino">Spuntino</option>
              <option value="cena">Cena</option>
            </select>
          </div>

          <div className="form-group">
            <label>Quantità a crudo (grammi)</label>
            <input 
              type="number" 
              className="form-control" 
              required 
              min="1"
              value={quantitaCruda}
              onChange={e => setQuantitaCruda(e.target.value)}
              placeholder="Es: 120"
            />
          </div>

          <div className="form-group">
            <label>Metodo di cottura</label>
            <select className="form-control" value={cottura} onChange={e => setCottura(e.target.value)}>
              <option value="crudo">Crudo</option>
              <option value="bollito">Bollito</option>
              <option value="al vapore">Al Vapore</option>
              <option value="al forno">Al Forno</option>
              <option value="in padella">In Padella</option>
              <option value="fritto">Fritto</option>
            </select>
          </div>

          {showsCondimenti && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ marginBottom: '1rem' }}>Condimenti / Grassi aggiunti</h4>
              <div className="form-group">
                <label>Tipo di grasso</label>
                <select className="form-control" value={condimentoId} onChange={e => setCondimentoId(e.target.value)}>
                  <option value="">-- Seleziona --</option>
                  {condimenti.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantità condimento (grammi)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="0"
                  value={quantitaCondimento}
                  onChange={e => setQuantitaCondimento(e.target.value)}
                  placeholder="Es: 10"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="scolato"
                  checked={scolato}
                  onChange={e => setScolato(e.target.checked)}
                />
                <label htmlFor="scolato" style={{ margin: 0 }}>Ho scolato l'olio in eccesso (-40%)</label>
              </div>
            </div>
          )}

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>
            Aggiungi al Diario
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content', position: 'sticky', top: '100px' }}>
        <h3 className="section-title">Riepilogo in Tempo Reale</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
          {Math.round(calTot)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kcal</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)' }}>Proteine</span>
            <span className="pro-color" style={{ fontWeight: 600 }}>{Math.round(proTot)}g</span>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)' }}>Carboidrati</span>
            <span className="car-color" style={{ fontWeight: 600 }}>{Math.round(carTot)}g</span>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)' }}>Grassi</span>
            <span className="gra-color" style={{ fontWeight: 600 }}>{Math.round(graTot)}g</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default FoodDetail;
