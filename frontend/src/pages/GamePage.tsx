import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Manager, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import { BingoCard } from '../components/BingoCard';
import './GamePage.css';

interface Card {
  id: string;
  numbers: number[][];
  matches: boolean[][];
  isComplete: boolean;
}

interface Player {
  id: string;
  name: string;
  cards: Card[];
}

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [lastNumbers, setLastNumbers] = useState<number[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [claimingBingo, setClaimingBingo] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean, message: string } | null>(null);

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    navigate('/');
  };

  useEffect(() => {
    if (!location.state?.playerName || !location.state?.cards) {
      navigate('/player');
      return;
    }

    const playerId = Date.now().toString();

    setPlayer({
      id: playerId,
      name: location.state.playerName,
      cards: location.state.cards
    });

    const manager = new Manager(API_BASE_URL);
    const newSocket = manager.socket('/');

    newSocket.on('connect', () => {
      console.log('Conectado al servidor');
      // Registrar al jugador
      newSocket.emit('playerJoined', {
        name: location.state.playerName,
        id: playerId
      });
    });

    newSocket.on('numberCalled', (number: number) => {
      setCurrentNumber(number);
      setLastNumbers(prev => [number, ...prev].slice(0, 5));
      setGameActive(true);
    });

    newSocket.on('gameStarted', () => {
      setGameActive(true);
      setLastNumbers([]);
      setCurrentNumber(null);
    });

    newSocket.on('gameEnded', () => {
      setGameActive(false);
    });

    newSocket.on('bingoValidationResult', (result: { playerId: string, playerName: string, isValid: boolean, message: string }) => {
      setClaimingBingo(false);
      
      // Determinar el mensaje según si es el ganador o no
      let displayMessage = result.message;
      if (result.isValid && result.playerId !== playerId) {
        // Otro jugador ganó
        displayMessage = `Lamentablemente esta no fue tu oportunidad. ¡${result.playerName} ha ganado!`;
      }
      
      setValidationResult({
        isValid: result.isValid && result.playerId === playerId,
        message: displayMessage
      });
      
      if (result.isValid) {
        setGameActive(false);
      }
    });

    setSocket(newSocket);
    setLoading(false);

    return () => {
      newSocket.disconnect();
    };
  }, [location.state, navigate]);

  const handleNumberClick = (cardId: string, row: number, col: number) => {
    if (!player) return;

    setPlayer(prevPlayer => {
      if (!prevPlayer) return null;
      
      const updatedCards = prevPlayer.cards.map(card => {
        if (card.id === cardId) {
          const newMatches = [...card.matches];
          newMatches[row] = [...newMatches[row]];
          newMatches[row][col] = !newMatches[row][col];
          return { ...card, matches: newMatches };
        }
        return card;
      });

      return { ...prevPlayer, cards: updatedCards };
    });
  };

  const handleClaimBingo = async (cardId: string) => {
    if (!socket || !player || claimingBingo) return;

    const card = player.cards.find(c => c.id === cardId);
    if (!card) return;

    setClaimingBingo(true);
    socket.emit('bingoClaimed', {
      playerId: player.id,
      playerName: player.name,
      cardId: cardId,
      card: card
    });
  };

  if (loading) {
    return (
      <div className="game-page loading">
        <div className="loader">Cargando juego...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="game-page error">
        <h2>Error</h2>
        <p>No se encontró información del jugador</p>
        <button onClick={() => navigate('/player')}>Volver</button>
      </div>
    );
  }

  return (
    <div className="game-page">
      <header className="game-header">
        <button className="logout-button" onClick={handleLogout}>
          Cerrar sesión
        </button>
        <div className="player-info">
          <h1>¡Bienvenido, {player.name}!</h1>
          <div className="game-status">
            {gameActive ? (
              <span className="status active">Juego en curso</span>
            ) : (
              <span className="status waiting">Esperando inicio...</span>
            )}
          </div>
        </div>
        
        <div className="number-display">
          <div className="current-number">
            <h2>Última balota</h2>
            <div className="number-ball">
              {currentNumber ?? '?'}
            </div>
          </div>
          
          <div className="last-numbers">
            <h3>Últimos números</h3>
            <div className="number-history">
              {lastNumbers.map((num, index) => (
                <div key={index} className="history-ball">
                  {num}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="cards-container">
        {player.cards.map(card => (
          <div key={card.id} className="card-wrapper">
            <BingoCard
              card={card}
              onNumberClick={(row, col) => handleNumberClick(card.id, row, col)}
              onClaimBingo={() => handleClaimBingo(card.id)}
              isAdmin={false}
            />
            <button
              className="bingo-button"
              onClick={() => handleClaimBingo(card.id)}
              disabled={claimingBingo}
            >
              {claimingBingo ? 'Verificando...' : '¡BINGO!'}
            </button>
          </div>
        ))}
      </main>

      {/* Modal de resultado de validación */}
      {validationResult && (
        <div className="validation-result-overlay" onClick={() => setValidationResult(null)}>
          <div className="validation-result-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-icon ${validationResult.isValid ? 'success' : 'error'}`}>
              {validationResult.isValid ? '😊' : '😢'}
            </div>
            <h2 className={validationResult.isValid ? 'success-title' : 'error-title'}>
              {validationResult.isValid ? '¡Felicitaciones!' : 'Lo sentimos'}
            </h2>
            <p className="modal-message">{validationResult.message}</p>
            <button 
              className="modal-close-button"
              onClick={() => setValidationResult(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 