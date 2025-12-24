import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BingoCard } from '../components/BingoCard';
import { API_BASE_URL } from '../config/api';
import './CardSelectionPage.css';

interface Card {
  id: string;
  numbers: number[][];
  matches: boolean[][];
  isComplete: boolean;
}

export const CardSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(true);
  const [paidCards, setPaidCards] = useState<number>(1);
  const [tempPaidCards, setTempPaidCards] = useState<number>(1);
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
          body: JSON.stringify({ count: 8 }), // Generamos 8 cartones para elegir
        });

        if (!response.ok) {
          throw new Error('Error al obtener los cartones');
        }

        const data = await response.json();
        const formattedCards = data.cards.map((numbers: number[][], index: number) => ({
          id: `card-${index + 1}`,
          numbers,
          matches: Array(5).fill(Array(5).fill(false)),
          isComplete: false
        }));
        setAvailableCards(formattedCards);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [navigate, playerName]);

  const handleCardSelect = (card: Card) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < paidCards) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handlePaymentConfirm = () => {
    if (tempPaidCards >= 1 && tempPaidCards <= 8) {
      setPaidCards(tempPaidCards);
      setShowPaymentModal(false);
    }
  };

  const handleConfirm = () => {
    if (selectedCards.length === 0) {
      alert('Por favor, selecciona al menos un cartón');
      return;
    }

    navigate('/game', {
      state: {
        playerName,
        cards: selectedCards,
        paidCards: paidCards
      }
    });
  };

  const handleBack = () => {
    navigate('/player');
  };

  if (loading) {
    return (
      <div className="card-selection-page loading">
        <div className="loader">Cargando cartones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-selection-page error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleBack}>Volver</button>
      </div>
    );
  }

  return (
    <div className="card-selection-page">
      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <h2>¿Cuántos cartones pagaste?</h2>
            <p>Selecciona el número de cartones que compraste (1-8)</p>
            <div className="payment-input-container">
              <button 
                className="payment-stepper-btn"
                onClick={() => setTempPaidCards(Math.max(1, tempPaidCards - 1))}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="8"
                value={tempPaidCards}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 8) {
                    setTempPaidCards(value);
                  }
                }}
                className="payment-input"
              />
              <button 
                className="payment-stepper-btn"
                onClick={() => setTempPaidCards(Math.min(8, tempPaidCards + 1))}
              >
                +
              </button>
            </div>
            <button 
              className="payment-confirm-btn"
              onClick={handlePaymentConfirm}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      <header className="selection-header">
        <button className="back-button" onClick={handleBack}>
          ← Volver
        </button>
        <div className="header-content">
          <h1>Selección de Cartones</h1>
          <h2>Jugador: {playerName}</h2>
          <p className="selection-info">
            Selecciona hasta {paidCards} {paidCards === 1 ? 'cartón' : 'cartones'} para jugar
          </p>
          <div className="selected-count">
            Cartones seleccionados: {selectedCards.length}/{paidCards}
          </div>
        </div>
      </header>

      <main className="cards-grid">
        {availableCards.map(card => (
          <div
            key={card.id}
            className={`card-wrapper ${
              selectedCards.find(c => c.id === card.id) ? 'selected' : ''
            }`}
            onClick={() => handleCardSelect(card)}
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

      <footer className="selection-footer">
        <button
          className="confirm-button"
          onClick={handleConfirm}
          disabled={selectedCards.length === 0}
        >
          Confirmar Selección
        </button>
      </footer>
    </div>
  );
}; 