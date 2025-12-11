import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BingoCard } from './BingoCard';
import './CardSelection.css';

interface Card {
  id: string;
  numbers: number[][];
  matches: boolean[][];
  isComplete: boolean;
}

const CardSelection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const player = location.state?.player;
    if (!player) {
      setError('Debes iniciar sesión primero');
    }
  }, [location.state]);

  const handleCardSelect = (card: Card) => {
    if (selectedCards.length < 4) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleConfirm = () => {
    if (selectedCards.length > 0) {
      navigate('/player/game', { 
        state: { 
          player: location.state?.player,
          cards: selectedCards 
        } 
      });
    }
  };

  if (error) {
    return <Navigate to="/player" replace />;
  }

  return (
    <div className="card-selection">
      <h1>Selección de Cartones</h1>
      <p>Selecciona hasta 4 cartones para jugar</p>
      <div className="selected-count">
        Cartones seleccionados: {selectedCards.length}/4
      </div>
      <div className="cards-grid">
        {/* Aquí irían los cartones disponibles para seleccionar */}
      </div>
      <button 
        className="confirm-button"
        onClick={handleConfirm}
        disabled={selectedCards.length === 0}
      >
        Confirmar Selección
      </button>
    </div>
  );
};

export default CardSelection; 