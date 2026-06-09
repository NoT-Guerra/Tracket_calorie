import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/alimenti?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Cerca Alimento</h1>
      
      <form onSubmit={handleSearch} className="form-group" style={{ display: 'flex', gap: '1rem' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Es: Riso, Petto di pollo..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Ricerca...' : 'Cerca'}
        </button>
      </form>

      <div className="grid-cards" style={{ marginTop: '2rem' }}>
        {results.map(al => (
          <div key={al.id} className="glass-panel food-card" onClick={() => navigate(`/food/${al.id}`)}>
            {al.foto_url ? (
              <img src={al.foto_url.startsWith('http') ? al.foto_url : `http://localhost:3001${al.foto_url}`} alt={al.nome} className="food-card-img" />
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
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
                Valori per 100g
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {results.length === 0 && !loading && query && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
          Nessun risultato trovato. Prova con un altro nome o aggiungi tu l'alimento.
        </p>
      )}
    </div>
  );
}

export default SearchPage;
