import React from 'react';
import './RoleSelection.css';

interface RoleSelectionProps {
  onRoleSelect: (isAdmin: boolean) => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect }) => {
  return (
    <div className="role-selection">
      <h1>Bingo en Línea</h1>
      <h2>Selecciona tu rol</h2>
      <div className="role-buttons">
        <button 
          className="role-button admin"
          onClick={() => onRoleSelect(true)}
        >
          Administrador
        </button>
        <button 
          className="role-button player"
          onClick={() => onRoleSelect(false)}
        >
          Jugador
        </button>
      </div>
    </div>
  );
}; 