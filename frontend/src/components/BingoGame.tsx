import React, { useState } from 'react';
import { BingoCard } from './BingoCard';
import { GameState, BingoCard as IBingoCard } from '../types/bingo';
import './BingoGame.css';

interface BingoGameProps {
  isAdmin: boolean;
}

export const BingoGame: React.FC<BingoGameProps> = ({ isAdmin }) => {
  const [gameState, setGameState] = useState<GameState>({
    currentNumber: null,
    drawnNumbers: [],
    bingoClaimedBy: null,
    isValidating: false
  });

  const [cards, setCards] = useState<IBingoCard[]>([]);

  const handleNumberClick = (cardId: string, row: number, col: number) => {
    setCards(prevCards =>
      prevCards.map(card => {
        if (card.id === cardId) {
          const newMatches = [...card.matches];
          newMatches[row][col] = !newMatches[row][col];
          return { ...card, matches: newMatches };
        }
        return card;
      })
    );
  };

  const handleClaimBingo = (cardId: string) => {
    setGameState(prev => ({
      ...prev,
      bingoClaimedBy: cardId,
      isValidating: true
    }));
  };

  return (
    <div className="bingo-game">
      <header className="game-header">
        <h1>Bingo en Línea</h1>
        <div className="current-number">
          <span>Última balota:</span>
          <div className="number-display">
            {gameState.currentNumber ?? '?'}
          </div>
        </div>
      </header>
      
      <main className="game-content">
        {isAdmin ? (
          <div className="admin-panel">
            <h2>Panel de Administrador</h2>
            {gameState.bingoClaimedBy && (
              <div className="validation-panel">
                <h3>¡Bingo Reclamado!</h3>
                <p>Cartón #{gameState.bingoClaimedBy}</p>
                <div className="validation-buttons">
                  <button className="validate-button success">Validar Bingo</button>
                  <button className="validate-button danger">Rechazar</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="player-cards">
            {cards.map(card => (
              <BingoCard
                key={card.id}
                card={card}
                onNumberClick={(row, col) => handleNumberClick(card.id, row, col)}
                onClaimBingo={handleClaimBingo}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}; 