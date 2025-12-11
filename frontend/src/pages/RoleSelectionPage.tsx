import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelectionPage.css';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (isAdmin: boolean) => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/player');
    }
  };

  return (
    <div className="role-selection-page">
      <div className="role-container">
        <h1>Bingo Online</h1>
        <p className="subtitle">Selecciona tu rol para comenzar</p>
        
        <div className="roles-grid">
          <div 
            className="role-card"
            onClick={() => handleRoleSelect(true)}
          >
            <div className="role-icon admin">
              <i className="fas fa-crown"></i>
            </div>
            <h2>Administrador</h2>
            <p>Gestiona el juego y llama los números</p>
          </div>

          <div 
            className="role-card"
            onClick={() => handleRoleSelect(false)}
          >
            <div className="role-icon player">
              <i className="fas fa-user"></i>
            </div>
            <h2>Jugador</h2>
            <p>Juega con uno o más cartones</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 