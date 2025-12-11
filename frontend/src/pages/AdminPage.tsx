import React, { useState, useEffect } from 'react';
import { Manager } from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { BingoCard } from '../components/BingoCard';
import { BallotDrum } from '../components/BallotDrum';
import './AdminPage.css';

interface Player {
  id: string;
  name: string;
  hasClaimed: boolean;
  cardToValidate?: {
    id: string;
    numbers: number[][];
    matches: boolean[][];
  };
}

interface AdminCard {
  id: string;
  numbers: number[][];
  matches: boolean[][];
  isComplete: boolean;
}

export const AdminPage: React.FC = () => {
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [adminCard, setAdminCard] = useState<AdminCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [validatingBingo, setValidatingBingo] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const fetchAdminCard = async () => {
      try {
        const response = await fetch('http://localhost:9001/api/cards/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ count: 1 }),
        });

        if (!response.ok) {
          throw new Error('Error al obtener el cartón de referencia');
        }

        const data = await response.json();
        setAdminCard({
          id: 'admin-card',
          numbers: data.cards[0],
          matches: Array(5).fill(Array(5).fill(false)),
          isComplete: false
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    };

    fetchAdminCard();

    const manager = new Manager('http://localhost:9001');
    const newSocket = manager.socket('/');

    newSocket.on('connect', () => {
      console.log('Administrador conectado');
    });

    newSocket.on('playerJoined', (player: Player) => {
      setPlayers(prev => [...prev, { ...player, hasClaimed: false }]);
    });

    newSocket.on('playerLeft', (playerId: string) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    newSocket.on('bingoClaimed', (data: { playerId: string, playerName: string, card: any }) => {
      setPlayers(prev => prev.map(p => 
        p.id === data.playerId 
          ? { ...p, hasClaimed: true, cardToValidate: data.card }
          : p
      ));
    });

    setSocket(newSocket);
    setLoading(false);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleGenerateNumber = async () => {
    if (!socket || !gameActive || isSpinning) return;

    setIsSpinning(true);
    
    try {
      const response = await fetch('http://localhost:9001/api/game/generate-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calledNumbers }),
      });

      if (!response.ok) {
        throw new Error('Error al generar número');
      }

      const { number } = await response.json();
      
      // Esperar 3 segundos antes de mostrar el número
      setTimeout(() => {
        setCurrentNumber(number);
        setCalledNumbers(prev => [...prev, number]);
        setIsSpinning(false);

        // Actualizar el cartón del admin
        if (adminCard) {
          const newMatches = adminCard.matches.map(row => [...row]);
          adminCard.numbers.forEach((row, i) => {
            row.forEach((num, j) => {
              if (num === number) {
                newMatches[i][j] = true;
              }
            });
          });
          setAdminCard({ ...adminCard, matches: newMatches });
        }

        socket.emit('numberCalled', number);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsSpinning(false);
    }
  };

  const handleStartGame = () => {
    if (!socket) return;
    setGameActive(true);
    setCalledNumbers([]);
    setCurrentNumber(null);
    socket.emit('gameStarted');
  };

  const handleResetGame = async () => {
    try {
      const response = await fetch('http://localhost:9001/api/game/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Error al reiniciar el juego');
      }

      setGameActive(false);
      setCalledNumbers([]);
      setCurrentNumber(null);
      socket?.emit('gameReset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleValidateBingo = async (player: Player) => {
    if (!socket || !player.cardToValidate || validatingBingo) return;

    setValidatingBingo(true);
    try {
      const response = await fetch('http://localhost:9001/api/game/validate-bingo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card: player.cardToValidate,
          calledNumbers
        }),
      });

      if (!response.ok) {
        throw new Error('Error al validar el bingo');
      }

      const { isValid } = await response.json();
      socket.emit('bingoValidationResult', {
        playerId: player.id,
        isValid,
        message: isValid ? '¡Felicitaciones! Has ganado el juego.' : 'Lo siento, el cartón no es ganador.'
      });

      if (isValid) {
        setGameActive(false);
        socket.emit('gameEnded');
      }

      setPlayers(prev => prev.map(p => 
        p.id === player.id ? { ...p, hasClaimed: false, cardToValidate: undefined } : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setValidatingBingo(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page loading">
        <div className="loader">Cargando panel de administrador...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Panel de Administrador</h1>
        <div className="game-controls">
          <button
            className="control-button start"
            onClick={handleStartGame}
            disabled={gameActive}
          >
            Iniciar Juego
          </button>
          <button
            className="control-button generate"
            onClick={handleGenerateNumber}
            disabled={!gameActive || isSpinning}
          >
            {isSpinning ? 'Generando...' : 'Generar Balota'}
          </button>
          <button
            className="control-button reset"
            onClick={handleResetGame}
            disabled={!gameActive}
          >
            Reiniciar Juego
          </button>
        </div>
      </header>

      <div className="game-status">
        <BallotDrum 
          isSpinning={isSpinning} 
          currentNumber={currentNumber}
          calledNumbers={calledNumbers}
        />
        <div className="called-numbers">
          <h3>Números llamados:</h3>
          <div className="number-list">
            {calledNumbers.map(num => (
              <span key={num} className="called-number">{num}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="reference-card-section">
          {adminCard && (
            <BingoCard
              card={{
                ...adminCard,
                calledNumbers: calledNumbers
              }}
              onNumberClick={() => {}}
              onClaimBingo={() => {}}
              isAdmin={true}
            />
          )}
        </div>

        <div className="players-section">
          <h2>Jugadores</h2>
          <div className="players-list">
            {players.map(player => (
              <div key={player.id} className={`player-item ${player.hasClaimed ? 'claiming' : ''}`}>
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  {player.hasClaimed && (
                    <span className="bingo-claim">¡BINGO!</span>
                  )}
                </div>
                {player.hasClaimed && (
                  <button
                    className="validate-button"
                    onClick={() => handleValidateBingo(player)}
                    disabled={validatingBingo}
                  >
                    {validatingBingo ? 'Validando...' : 'Validar BINGO'}
                  </button>
                )}
              </div>
            ))}
            {players.length === 0 && (
              <p className="no-players">No hay jugadores conectados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 