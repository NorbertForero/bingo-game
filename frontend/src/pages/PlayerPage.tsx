import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerPage.css';

export const PlayerPage: React.FC = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    navigate('/play', { state: { playerName } });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="player-page">
      <div className="player-form-container">
        <h1>Bingo Online</h1>
        <form onSubmit={handleSubmit} className="player-form">
          <div className="form-group">
            <label htmlFor="playerName">Nombre del Jugador</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ingresa tu nombre"
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
          
          <div className="button-group">
            <button type="button" onClick={handleBack} className="back-button">
              Volver
            </button>
            <button type="submit" className="start-button">
              Comenzar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 