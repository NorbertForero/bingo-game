import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { PlayerPage } from './pages/PlayerPage';
import { CardSelectionPage } from './pages/CardSelectionPage';
import { GamePage } from './pages/GamePage';
import { AdminPage } from './pages/AdminPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelectionPage />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/play" element={<CardSelectionPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App; 