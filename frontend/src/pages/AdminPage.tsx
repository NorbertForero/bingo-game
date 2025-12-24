import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Manager, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import { BingoCard } from '../components/BingoCard';
import { BallotDrum } from '../components/BallotDrum';
import { PatternConfigModal, GamePattern } from '../components/PatternConfigModal';
import './AdminPage.css';

interface Player {
  id: string;
  name: string;
  hasClaimed: boolean;
  paidCards?: number;
  selectedCards?: number;
  /**
   * Orden en el que reclamó BINGO (1 = primero, 2 = segundo, etc.)
   * undefined si aún no ha reclamado.
   */
  bingoOrder?: number;
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
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [currentColumn, setCurrentColumn] = useState<string | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [calledBalls, setCalledBalls] = useState<Array<{ number: number; column: string }>>([]);
  const [adminCard, setAdminCard] = useState<AdminCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [validatingBingo, setValidatingBingo] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPlayerForValidation, setSelectedPlayerForValidation] = useState<Player | null>(null);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [gamePatterns, setGamePatterns] = useState<GamePattern[]>([]);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [completedPatterns, setCompletedPatterns] = useState<string[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ name: string; patternName: string } | null>(null);

  useEffect(() => {
    const fetchAdminCard = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/cards/generate`, {
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

    const manager = new Manager(API_BASE_URL);
    const newSocket = manager.socket('/');

    newSocket.on('connect', () => {
      console.log('Administrador conectado');
    });

    newSocket.on('playerJoined', (player: Player) => {
      setPlayers(prev => [
        ...prev,
        { ...player, hasClaimed: false, bingoOrder: undefined },
      ]);
    });

    newSocket.on('playerLeft', (playerId: string) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    newSocket.on('bingoClaimed', (data: { playerId: string; playerName: string; card: any }) => {
      setPlayers(prev => {
        // Calcular el siguiente orden disponible (1, 2, 3, ...)
        const maxOrder =
          prev.reduce(
            (max, p) => (p.bingoOrder && p.bingoOrder > max ? p.bingoOrder : max),
            0
          ) || 0;

        const updated = prev.map(p =>
          p.id === data.playerId
            ? {
              ...p,
              hasClaimed: true,
              cardToValidate: data.card,
              bingoOrder: p.bingoOrder ?? maxOrder + 1,
            }
            : p
        );

        // Ordenar para que quienes reclamaron BINGO primero aparezcan arriba
        return [...updated].sort((a, b) => {
          const orderA = a.bingoOrder ?? Infinity;
          const orderB = b.bingoOrder ?? Infinity;
          if (orderA === orderB) return a.name.localeCompare(b.name);
          return orderA - orderB;
        });
      });
    });

    setSocket(newSocket);
    setLoading(false);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Reiniciar el juego antes de cerrar sesión
      await fetch(`${API_BASE_URL}/api/game/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (err) {
      console.error('Error al reiniciar el juego:', err);
    } finally {
      // Desconectar socket y navegar al inicio
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      navigate('/');
    }
  };

  const handleGenerateNumber = async () => {
    if (!socket || !gameActive || isSpinning) return;

    setIsSpinning(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/game/generate-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calledNumbers }),
      });

      if (!response.ok) {
        throw new Error('Error al generar número');
      }

      const { number, column } = await response.json();

      // Esperar 3 segundos antes de mostrar el número
      setTimeout(() => {
        setCurrentNumber(number);
        setCurrentColumn(column);
        setCalledNumbers(prev => [...prev, number]);
        setCalledBalls(prev => [{ number, column }, ...prev].slice(0, 3));
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
    setShowPatternModal(true);
  };

  const handlePatternConfirm = (patterns: GamePattern[]) => {
    if (!socket) return;
    setGamePatterns(patterns);
    setCurrentPatternIndex(0);
    setCompletedPatterns([]);
    setGameActive(true);
    setCalledNumbers([]);
    setCalledBalls([]);
    setCurrentNumber(null);
    setCurrentColumn(null);
    setShowPatternModal(false);
    socket.emit('gameStarted', { patterns });
  };

  const handlePatternCancel = () => {
    setShowPatternModal(false);
  };

  const handleResetGame = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/reset`, {
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
      setCalledBalls([]);
      setCurrentNumber(null);
      setCurrentColumn(null);
      setGamePatterns([]);
      setCurrentPatternIndex(0);
      setCompletedPatterns([]);
      // Reiniciar estado de los jugadores (borrar reclamos y orden)
      setPlayers(prev =>
        prev.map(p => ({
          ...p,
          hasClaimed: false,
          bingoOrder: undefined,
          cardToValidate: undefined,
        }))
      );
      socket?.emit('gameReset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleValidateBingo = async (player: Player, isApproved: boolean) => {
    if (!socket || !player.cardToValidate || validatingBingo) return;

    setValidatingBingo(true);
    try {
      if (isApproved) {
        const currentPattern = gamePatterns[currentPatternIndex];
        const response = await fetch(`${API_BASE_URL}/api/game/validate-bingo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            card: player.cardToValidate,
            calledNumbers,
            pattern: currentPattern
          }),
        });

        if (!response.ok) {
          throw new Error('Error al validar el bingo');
        }

        const { isValid } = await response.json();
        
        if (isValid) {
          // Patrón completado exitosamente
          setCompletedPatterns(prev => [...prev, currentPattern.id]);
          
          // Mostrar modal de celebración
          setWinnerInfo({
            name: player.name,
            patternName: currentPattern.name
          });
          setShowWinnerModal(true);
          
          socket.emit('bingoValidationResult', {
            playerId: player.id,
            playerName: player.name,
            isValid: true,
            patternName: currentPattern.name,
            message: `¡Felicitaciones! Has completado el patrón "${currentPattern.name}".`
          });

          // Verificar si hay más patrones
          if (currentPatternIndex < gamePatterns.length - 1) {
            // Avanzar al siguiente patrón
            setCurrentPatternIndex(prev => prev + 1);
            socket.emit('patternCompleted', {
              completedPattern: currentPattern,
              nextPattern: gamePatterns[currentPatternIndex + 1]
            });
          } else {
            // Era el último patrón, terminar el juego
            setGameActive(false);
            socket.emit('gameEnded');
          }
        } else {
          socket.emit('bingoValidationResult', {
            playerId: player.id,
            playerName: player.name,
            isValid: false,
            message: 'Lo siento, el cartón no cumple con el patrón actual.'
          });
        }
      } else {
        // Rechazado por el administrador - el juego continúa
        socket.emit('bingoValidationResult', {
          playerId: player.id,
          playerName: player.name,
          isValid: false,
          message: 'El BINGO fue rechazado por el administrador.'
        });
      }

      setPlayers(prev => prev.map(p =>
        p.id === player.id ? { ...p, hasClaimed: false, cardToValidate: undefined, bingoOrder: undefined } : p
      ));
      setSelectedPlayerForValidation(null);
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
          <button className="control-button reset" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>



      <div className="admin-content">
        <div className="reference-card-section">
          <div className="current-pattern-display">
            <h3>
              Patrón Actual: {gameActive && gamePatterns.length > 0 
                ? gamePatterns[currentPatternIndex].name 
                : 'Sin patrón seleccionado'}
            </h3>
            <p>
              {gameActive && gamePatterns.length > 0 
                ? gamePatterns[currentPatternIndex].description 
                : 'Inicia un juego para seleccionar un patrón'}
            </p>
            {!gameActive && (
              <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#4ECDC4' }}>
                ¿Quieres Jugar? ¡Es muy divertido! 🎉
              </p>
            )}
            {gameActive && gamePatterns.length > 0 && (
              <div className="pattern-progress">
                {gamePatterns.map((pattern, index) => (
                  <div
                    key={pattern.id}
                    className={`pattern-indicator ${
                      completedPatterns.includes(pattern.id)
                        ? 'completed'
                        : index === currentPatternIndex
                        ? 'current'
                        : 'pending'
                    }`}
                  >
                    {index + 1}. {pattern.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="game-status">
            <BallotDrum
              isSpinning={isSpinning}
              currentNumber={currentNumber}
              currentColumn={currentColumn}
              calledNumbers={calledNumbers}
            />
            <div className="called-numbers called-numbers--sidebar">
              <h2>Últimas Balotas:</h2>
              <div className="number-list carousel">
                {calledBalls.map((ball, index) => (
                  <span key={`${ball.column}-${ball.number}-${index}`} className={`called-number ${index === 0 ? 'slide-in' : ''}`}>
                    <span className="ball-letter">{ball.column}</span>
                    <span className="ball-number">{ball.number}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="button-controls">
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
          </div>
          {adminCard && (
            <BingoCard
              card={{
                ...adminCard,
                calledNumbers: calledNumbers
              }}
              onNumberClick={() => { }}
              onClaimBingo={() => { }}
              isAdmin={true}
            />
          )}
        </div>

        <div className="players-section">



          <h2>Jugadores</h2>
          <div className="players-list">
            {players.map(player => (
              <div key={player.id} className={`player-item ${player.hasClaimed ? 'claiming' : ''}`}>
                <div className="player-info-admin">
                  <span className="player-name">{player.name}</span>
                  {player.paidCards && player.selectedCards && (
                    <span className="player-cards-info">
                      ({player.selectedCards}/{player.paidCards} cartones)
                    </span>
                  )}
                  {typeof player.bingoOrder === 'number' && (
                    <span className="bingo-order">
                      #{player.bingoOrder}
                    </span>
                  )}
                </div>
                {player.hasClaimed && (
                  <div className="bingo-validation-box">
                    <div className="bingo-header">
                      <span className="bingo-claim-text">¡BINGO RECLAMADO!</span>
                    </div>
                    <button
                      className="validate-bingo-button"
                      onClick={() => setSelectedPlayerForValidation(player)}
                    >
                      Ver Cartón y Validar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {players.length === 0 && (
              <p className="no-players">No hay jugadores conectados</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de validación */}
      {selectedPlayerForValidation && selectedPlayerForValidation.cardToValidate && (
        <div className="validation-modal-overlay" onClick={() => setSelectedPlayerForValidation(null)}>
          <div className="validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Validar BINGO de {selectedPlayerForValidation.name}</h2>
              <button
                className="close-button"
                onClick={() => setSelectedPlayerForValidation(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="modal-card">
                <div className="player-bingo-card">
                  <div className="card-info">
                    <h3>Cartón del Jugador</h3>
                    <p>Números llamados: {calledNumbers.length}</p>
                  </div>
                  <BingoCard
                    card={{
                      id: selectedPlayerForValidation.cardToValidate.id,
                      numbers: selectedPlayerForValidation.cardToValidate.numbers,
                      matches: selectedPlayerForValidation.cardToValidate.matches,
                      isComplete: false,
                      calledNumbers: calledNumbers
                    }}
                    onNumberClick={() => { }}
                    onClaimBingo={() => { }}
                    isAdmin={false}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="approve-button"
                  onClick={() => handleValidateBingo(selectedPlayerForValidation, true)}
                  disabled={validatingBingo}
                >
                  {validatingBingo ? 'Validando...' : '✓ Aprobar'}
                </button>
                <button
                  className="reject-button"
                  onClick={() => handleValidateBingo(selectedPlayerForValidation, false)}
                  disabled={validatingBingo}
                >
                  ✗ Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuración de patrones */}
      {showPatternModal && (
        <PatternConfigModal
          onConfirm={handlePatternConfirm}
          onCancel={handlePatternCancel}
        />
      )}

      {/* Modal de celebración de ganador */}
      {showWinnerModal && winnerInfo && (
        <div className="winner-modal-overlay" onClick={() => setShowWinnerModal(false)}>
          <div className="winner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confetti-container">
              {[...Array(50)].map((_, i) => (
                <div key={i} className="confetti" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#A8E6CF'][Math.floor(Math.random() * 5)]
                }} />
              ))}
            </div>
            <div className="winner-content">
              <div className="trophy-icon">🏆</div>
              <h1 className="winner-title">¡GANADOR!</h1>
              <div className="winner-name">{winnerInfo.name}</div>
              <div className="winner-pattern">
                Patrón completado: <strong>{winnerInfo.patternName}</strong>
              </div>
              <div className="celebration-emoji">🎉🎊🎇</div>
              <button className="close-winner-button" onClick={() => setShowWinnerModal(false)}>
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 