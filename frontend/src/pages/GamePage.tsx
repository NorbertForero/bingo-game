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
  const [currentColumn, setCurrentColumn] = useState<string | null>(null);
  const [lastNumbers, setLastNumbers] = useState<Array<{ number: number; column: string }>>([]);

  // Función para obtener la letra según el número
  const getColumnLetter = (number: number): string => {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '';
  };
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [claimingBingo, setClaimingBingo] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean, message: string } | null>(null);
  const [paidCards, setPaidCards] = useState<number>(0);

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

    const paidCardsCount = location.state?.paidCards || location.state.cards.length;
    setPaidCards(paidCardsCount);

    // Usar un ID consistente basado en el nombre y los cartones
    const cardIds = location.state.cards.map((c: Card) => c.id).join('-');
    const playerId = `${location.state.playerName}_${cardIds}`;

    // Cargar marcas guardadas desde localStorage si existen
    const savedMarks = localStorage.getItem(`bingoMarks_${playerId}`);
    let cards = location.state.cards;
    
    if (savedMarks) {
      try {
        const marksData = JSON.parse(savedMarks);
        cards = cards.map((card: Card) => {
          if (marksData[card.id]) {
            return { ...card, matches: marksData[card.id] };
          }
          return card;
        });
      } catch (e) {
        console.error('Error al cargar marcas guardadas:', e);
      }
    }

    setPlayer({
      id: playerId,
      name: location.state.playerName,
      cards: cards
    });

    const manager = new Manager(API_BASE_URL);
    const newSocket = manager.socket('/');

    newSocket.on('connect', () => {
      console.log('Conectado al servidor');
      // Registrar al jugador
      newSocket.emit('playerJoined', {
        name: location.state.playerName,
        id: playerId,
        paidCards: paidCardsCount,
        selectedCards: location.state.cards.length
      });
    });

    newSocket.on('numberCalled', (number: number) => {
      setCurrentNumber(number);
      const column = getColumnLetter(number);
      setCurrentColumn(column);
      setLastNumbers(prev => [{ number, column }, ...prev].slice(0, 5));
      setGameActive(true); // Activar el juego cuando sale la primera balota
    });

    newSocket.on('gameStarted', () => {
      setGameActive(false); // Permitir cambiar cartones al inicio
      setLastNumbers([]);
      setCurrentNumber(null);
      setCurrentColumn(null);
      
      // Limpiar marcas del juego anterior
      if (player) {
        localStorage.removeItem(`bingoMarks_${player.id}`);
        setPlayer(prevPlayer => {
          if (!prevPlayer) return null;
          
          const clearedCards = prevPlayer.cards.map(card => ({
            ...card,
            matches: card.matches.map(row => row.map(() => false))
          }));
          
          return { ...prevPlayer, cards: clearedCards };
        });
      }
    });

    newSocket.on('gameEnded', () => {
      setGameActive(false);
    });

    newSocket.on('bingoValidationResult', (result: { playerId: string, playerName: string, isValid: boolean, message: string }) => {
      // Solo procesar si el resultado es para este jugador
      if (result.playerId !== playerId) {
        return;
      }
      
      setClaimingBingo(false);
      
      setValidationResult({
        isValid: result.isValid,
        message: result.message
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

      // Guardar marcas en localStorage
      const marksToSave = updatedCards.reduce((acc, card) => {
        acc[card.id] = card.matches;
        return acc;
      }, {} as Record<string, boolean[][]>);
      localStorage.setItem(`bingoMarks_${prevPlayer.id}`, JSON.stringify(marksToSave));

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

  const handleClearMarks = () => {
    if (!player) return;

    setPlayer(prevPlayer => {
      if (!prevPlayer) return null;
      
      const updatedCards = prevPlayer.cards.map(card => ({
        ...card,
        matches: card.matches.map(row => row.map(() => false))
      }));

      // Limpiar marcas de localStorage
      localStorage.removeItem(`bingoMarks_${prevPlayer.id}`);

      return { ...prevPlayer, cards: updatedCards };
    });
  };

  const handleChangeCards = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    // Limpiar marcas guardadas al cambiar cartones
    if (player) {
      localStorage.removeItem(`bingoMarks_${player.id}`);
    }
    navigate('/play', { state: { playerName: player?.name } });
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
        <div className="header-buttons">
          <button className="clear-button" onClick={handleClearMarks}>
            Limpiar marcas
          </button>
          <button 
            className="change-cards-button" 
            onClick={handleChangeCards}
            disabled={gameActive}
          >
            Cambiar cartones
          </button>
          <button className="logout-button-game" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
        <div className="player-info">
          <h1>¡Bienvenido, {player.name}!</h1>
          <div className="game-status-listener">
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
              {currentColumn && <span className="ball-letter">{currentColumn}</span>}
              <span className="ball-number">{currentNumber ?? '?'}</span>
            </div>
          </div>
          
          <div className="last-numbers">
            <h3>Últimos números</h3>
            <div className="number-history">
              {lastNumbers.map((ball, index) => (
                <div key={index} className="history-ball">
                  <span className="history-letter">{ball.column}</span>
                  <span className="history-number">{ball.number}</span>
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