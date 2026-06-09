import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DiaryPage from './pages/DiaryPage';
import SearchPage from './pages/SearchPage';
import FoodDetail from './pages/FoodDetail';
import CustomFoodPage from './pages/CustomFoodPage';

function App() {
  const [userId, setUserId] = useState(1); // Utente di default per semplicità

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">Calorie Tracker</Link>
        </div>
        <div className="nav-links">
          <Link to="/">Diario</Link>
          <Link to="/search">Cerca Alimento</Link>
          <Link to="/custom-food">Nuovo Alimento</Link>
          <div className="user-select">
            <label>User ID: </label>
            <input 
              type="number" 
              value={userId} 
              onChange={e => setUserId(Number(e.target.value))} 
              min="1"
            />
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DiaryPage userId={userId} />} />
          <Route path="/search" element={<SearchPage userId={userId} />} />
          <Route path="/food/:id" element={<FoodDetail userId={userId} />} />
          <Route path="/custom-food" element={<CustomFoodPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
