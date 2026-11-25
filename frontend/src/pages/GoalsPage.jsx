import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GoalsPage({ userId, onUsersUpdated }) {
  const [formData, setFormData] = useState({
    obiettivo_calorie: 2000,
    obiettivo_proteine: 100,
    obiettivo_carboidrati: 200,
    obiettivo_grassi: 65,
    obiettivo_fibre: 25
  });
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/api/utenti/${userId}`);
        setUsername(res.data.username || `Utente #${userId}`);
        setFormData({
          obiettivo_calorie: res.data.obiettivo_calorie ?? 2000,
          obiettivo_proteine: res.data.obiettivo_proteine ?? 100,
          obiettivo_carboidrati: res.data.obiettivo_carboidrati ?? 200,
          obiettivo_grassi: res.data.obiettivo_grassi ?? 65,
          obiettivo_fibre: res.data.obiettivo_fibre ?? 25
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSavedMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedMessage('');
    try {
      await axios.put(`/api/utenti/${userId}/obiettivi`, {
        obiettivo_calorie: Number(formData.obiettivo_calorie),
        obiettivo_proteine: Number(formData.obiettivo_proteine),
        obiettivo_carboidrati: Number(formData.obiettivo_carboidrati),
        obiettivo_grassi: Number(formData.obiettivo_grassi),
        obiettivo_fibre: Number(formData.obiettivo_fibre)
      });
      setSavedMessage('Obiettivi aggiornati con successo!');
      if (onUsersUpdated) onUsersUpdated();
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio degli obiettivi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    try {
      const res = await axios.post('/api/utenti', {
        username: newUsername.trim(),
        obiettivo_calorie: Number(formData.obiettivo_calorie) || 2000,
        obiettivo_proteine: Number(formData.obiettivo_proteine) || 100,
        obiettivo_carboidrati: Number(formData.obiettivo_carboidrati) || 200,
        obiettivo_grassi: Number(formData.obiettivo_grassi) || 65,
        obiettivo_fibre: Number(formData.obiettivo_fibre) || 25
      });
      setNewUsername('');
      if (onUsersUpdated) onUsersUpdated(res.data.id);
    } catch (err) {
      console.error(err);
      alert('Errore nella creazione del nuovo profilo utente');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h1 className="page-title">Obiettivi Giornalieri</h1>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>
          Profilo attivo: <span style={{ color: 'var(--primary)' }}>{username}</span>
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Calorie giornaliere (kcal)</label>
            <input
              type="number"
              name="obiettivo_calorie"
              className="form-control"
              required
              min="500"
              max="10000"
              value={formData.obiettivo_calorie}
              onChange={handleChange}
            />
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Proteine (g)</label>
              <input
                type="number"
                step="0.5"
                name="obiettivo_proteine"
                className="form-control"
                required
                min="0"
                value={formData.obiettivo_proteine}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Carboidrati (g)</label>
              <input
                type="number"
                step="0.5"
                name="obiettivo_carboidrati"
                className="form-control"
                required
                min="0"
                value={formData.obiettivo_carboidrati}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Grassi (g)</label>
              <input
                type="number"
                step="0.5"
                name="obiettivo_grassi"
                className="form-control"
                required
                min="0"
                value={formData.obiettivo_grassi}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Fibre (g)</label>
              <input
                type="number"
                step="0.5"
                name="obiettivo_fibre"
                className="form-control"
                required
                min="0"
                value={formData.obiettivo_fibre}
                onChange={handleChange}
              />
            </div>
          </div>

          {savedMessage && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--secondary)',
              fontWeight: 500
            }}>
              {savedMessage}
            </div>
          )}

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva Obiettivi'}
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 className="section-title">Aggiungi Nuovo Utente</h3>
        <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="Nome nuovo profilo (es. Marco)"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-secondary">
            Crea Profilo
          </button>
        </form>
      </div>
    </div>
  );
}

export default GoalsPage;
