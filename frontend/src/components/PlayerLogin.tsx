import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerLogin.css';

const PlayerLogin: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }
    navigate('/player/cards', { state: { playerName } });
  };

  return (
    <div className="login-container">
      <div className="login-logo">
        <h1>¡Bingo!</h1>
      </div>
      <div className="login-form">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ingresa tu nombre"
            required
          />
          <button type="submit">Continuar</button>
        </form>
      </div>
    </div>
  );
};

export default PlayerLogin; 