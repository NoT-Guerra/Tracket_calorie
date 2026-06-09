import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CustomFoodPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    marca: '',
    calorie_100g: '',
    proteine_100g: '',
    carboidrati_100g: '',
    grassi_100g: '',
    fibra_100g: ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (image) {
      data.append('immagine', image);
    }

    try {
      const res = await axios.post('/api/alimenti', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/food/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Errore nella creazione dell\'alimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="page-title">Nuovo Alimento</h1>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome Alimento *</label>
            <input type="text" name="nome" className="form-control" required value={formData.nome} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Marca</label>
            <input type="text" name="marca" className="form-control" value={formData.marca} onChange={handleChange} />
          </div>
          
          <h3 style={{ margin: '2rem 0 1rem 0' }}>Valori per 100g a crudo</h3>
          <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Calorie (kcal) *</label>
              <input type="number" name="calorie_100g" className="form-control" required min="0" value={formData.calorie_100g} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Proteine (g) *</label>
              <input type="number" step="0.1" name="proteine_100g" className="form-control" required min="0" value={formData.proteine_100g} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Carboidrati (g) *</label>
              <input type="number" step="0.1" name="carboidrati_100g" className="form-control" required min="0" value={formData.carboidrati_100g} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Grassi (g) *</label>
              <input type="number" step="0.1" name="grassi_100g" className="form-control" required min="0" value={formData.grassi_100g} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Fibre (g)</label>
              <input type="number" step="0.1" name="fibra_100g" className="form-control" min="0" value={formData.fibra_100g} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>Immagine Alimento (Opzionale)</label>
            <input type="file" accept="image/*" className="form-control" onChange={handleFileChange} />
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '2rem' }} disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva Alimento'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CustomFoodPage;
