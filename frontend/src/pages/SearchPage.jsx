import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const performSearch = async (forceOnline = false) => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const onlineParam = forceOnline ? '&online=1' : '';
      const res = await axios.get(`/api/alimenti?q=${encodeURIComponent(query.trim())}${onlineParam}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await performSearch(false);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Cerca Alimento</h1>

      <form onSubmit={handleSearch} className="form-group" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-control"
          style={{ flex: 1, minWidth: '220px' }}
          placeholder="Es: Riso, Petto di pollo, Barilla..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Ricerca...' : 'Cerca'}
        </button>
        {searched && query.trim() && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading}
            onClick={() => performSearch(true)}
            title="Cerca anche su Open Food Facts online e salva in cache"
          >
            Cerca su Open Food Facts
          </button>
        )}
      </form>

      <div className="grid-cards" style={{ marginTop: '2rem' }}>
        {results.map(al => (
          <div key={al.id} className="glass-panel food-card" onClick={() => navigate(`/food/${al.id}`)}>
            {al.foto_url ? (
              <img src={al.foto_url} alt={al.nome} className="food-card-img" />
            ) : (
              <div className="food-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nessuna foto</span>
              </div>
            )}
            <div className="food-card-body">
              <div className="food-card-title">{al.nome}</div>
              <div className="food-card-brand">{al.marca || 'Generico'}</div>
              <div className="food-card-stats">
                <span>{al.calorie_100g} kcal</span>
                <span>P: {al.proteine_100g}g</span>
                <span>C: {al.carboidrati_100g}g</span>
                <span>G: {al.grassi_100g}g</span>
                <span>F: {al.fibra_100g || 0}g</span>
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
                Valori per 100g
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && searched && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
          Nessun risultato trovato. Prova con un altro nome o aggiungi tu l'alimento.
        </p>
      )}
    </div>
  );
}

export default SearchPage;
