import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import DiaryPage from './pages/DiaryPage';
import SearchPage from './pages/SearchPage';
import FoodDetail from './pages/FoodDetail';
import CustomFoodPage from './pages/CustomFoodPage';
import GoalsPage from './pages/GoalsPage';

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function App() {
  const [userId, setUserId] = useState(1);
  const [users, setUsers] = useState([{ id: 1, username: 'UtenteTest' }]);
  const [selectedDate, setSelectedDate] = useState(getTodayString);

  const fetchUsers = useCallback(async (selectId) => {
    try {
      const res = await axios.get('/api/utenti');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setUsers(res.data);
        if (selectId) {
          setUserId(Number(selectId));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
          <Link to="/obiettivi">Obiettivi</Link>
          <div className="user-select">
            <label htmlFor="user-selector">Utente:</label>
            <select
              id="user-selector"
              value={userId}
              onChange={(e) => setUserId(Number(e.target.value))}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <DiaryPage
                userId={userId}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            }
          />
          <Route
            path="/search"
            element={<SearchPage userId={userId} selectedDate={selectedDate} />}
          />
          <Route
            path="/food/:id"
            element={
              <FoodDetail
                userId={userId}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            }
          />
          <Route path="/custom-food" element={<CustomFoodPage />} />
          <Route
            path="/obiettivi"
            element={<GoalsPage userId={userId} onUsersUpdated={fetchUsers} />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
