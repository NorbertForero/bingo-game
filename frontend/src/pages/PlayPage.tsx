import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BingoCard } from '../components/BingoCard';
import { API_BASE_URL } from '../config/api';
import './PlayPage.css';

interface Card {
  id: string;
  numbers: number[][];
  matches: boolean[][];
  isSelected: boolean;
  isComplete: boolean;
}

export const PlayPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const playerName = location.state?.playerName;

  useEffect(() => {
    if (!playerName) {
      navigate('/player');
      return;
    }

    const fetchCards = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/cards/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ count: 8 }), // Solicitamos 8 cartones para elegir
        });

        if (!response.ok) {
          throw new Error('Error al obtener los cartones');
        }

        const data = await response.json();
        const formattedCards = data.cards.map((numbers: number[][], index: number) => ({
          id: `card-${index + 1}`,
          numbers,
          matches: Array(5).fill(Array(5).fill(false)),
          isSelected: false,
          isComplete: false
        }));
        setCards(formattedCards);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [navigate, playerName]);

  const handleCardSelect = (cardId: string) => {
    setCards(prevCards => {
      const updatedCards = prevCards.map(card => {
        if (card.id === cardId) {
          // Solo permitir selección si no excede el límite o si ya está seleccionada
          if (!card.isSelected && selectedCount >= 4) {
            return card;
          }
          return { ...card, isSelected: !card.isSelected };
        }
        return card;
      });

      // Actualizar el contador de seleccionados
      const newSelectedCount = updatedCards.filter(card => card.isSelected).length;
      setSelectedCount(newSelectedCount);

      return updatedCards;
    });
  };

  const handleStartGame = () => {
    if (selectedCount === 0) {
      setError('Por favor, selecciona al menos un cartón para jugar');
      return;
    }

    const selectedCards = cards.filter(card => card.isSelected);
    navigate('/game', {
      state: {
        playerName,
        cards: selectedCards
      }
    });
  };

  const handleBack = () => {
    navigate('/player');
  };

  if (loading) {
    return (
      <div className="play-page loading">
        <div className="loader">Cargando cartones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="play-page error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleBack}>Volver</button>
      </div>
    );
  }

  return (
    <div className="play-page">
      <header className="play-header">
        <button className="back-button" onClick={handleBack}>
          ← Volver
        </button>
        <div className="header-content">
          <h1>Selección de Cartones</h1>
          <p className="player-name">Jugador: {playerName}</p>
          <p className="selection-info">
            Selecciona entre 1 y 4 cartones para jugar
          </p>
          <div className="selected-count">
            Cartones seleccionados: {selectedCount}/4
          </div>
        </div>
      </header>

      <main className="cards-grid">
        {cards.map(card => (
          <div
            key={card.id}
            className={`card-wrapper ${card.isSelected ? 'selected' : ''}`}
            onClick={() => handleCardSelect(card.id)}
          >
            <BingoCard
              card={card}
              onNumberClick={() => {}}
              onClaimBingo={() => {}}
              isAdmin={false}
            />
          </div>
        ))}
      </main>

      <footer className="play-footer">
        <button
          className="start-game-button"
          onClick={handleStartGame}
          disabled={selectedCount === 0}
        >
          Comenzar Juego
        </button>
      </footer>
    </div>
  );
}; 