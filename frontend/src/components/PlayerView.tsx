import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { Manager } from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { BingoCard } from './BingoCard';
import BallDisplay from './BallDisplay';
import './PlayerView.css';

interface Player {
  id: string;
  name: string;
  cards: {
    id: string;
    numbers: number[][];
    matches: boolean[][];
    isComplete: boolean;
  }[];
}

const PlayerView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [player, setPlayer] = useState<Player | null>(location.state?.player || null);
  const [error, setError] = useState<string>('');
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [gameActive, setGameActive] = useState(false);

  // Efecto para obtener los datos del jugador
  useEffect(() => {
    const fetchPlayer = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`http://localhost:9001/api/players/${id}`);
        if (!response.ok) {
          throw new Error('Jugador no encontrado');
        }
        const data = await response.json();
        setPlayer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    };

    if (!player && id) {
      fetchPlayer();
    }
  }, [id, player]);

  // Efecto para la conexión del socket
  useEffect(() => {
    if (!player) return;

    try {
      const manager = new Manager('http://localhost:9001');
      const newSocket = manager.socket('/');
      
      // Configurar los event listeners antes de establecer el socket
      newSocket.on('connect', () => {
        console.log('Conectado al servidor');
      });

      newSocket.on('disconnect', () => {
        console.log('Desconectado del servidor');
        setGameActive(false);
      });

      newSocket.on('numberCalled', (number: number) => {
        console.log('Número llamado:', number);
        setCurrentNumber(number);
        setGameActive(true);
      });

      newSocket.on('gameWon', (winnerName: string) => {
        console.log('Juego ganado por:', winnerName);
        setGameActive(false);
        
        if (player && winnerName === player.name) {
          setHasWon(true);
          alert('¡BINGO! ¡Has ganado el juego!');
        } else {
          alert(`¡${winnerName} ha ganado el juego!`);
        }
      });

      newSocket.on('gameStarted', () => {
        console.log('Juego iniciado');
        setGameActive(true);
        setHasWon(false);
        setCurrentNumber(null);
      });

      setSocket(newSocket);

      // Limpieza al desmontar
      return () => {
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('numberCalled');
        newSocket.off('gameWon');
        newSocket.off('gameStarted');
        newSocket.close();
      };
    } catch (err) {
      console.error('Error al conectar con el servidor:', err);
    }
  }, [player]);

  const handleNumberClick = async (cardId: string, row: number, col: number) => {
    if (!player || !gameActive) return;

    try {
      const response = await fetch('http://localhost:9001/api/game/check-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: player.id,
          cardId,
          row,
          col
        }),
      });

      if (!response.ok) {
        throw new Error('Error al verificar el número');
      }

      const { isMatch } = await response.json();
      if (isMatch) {
        setPlayer(prevPlayer => {
          if (!prevPlayer) return null;
          const updatedCards = prevPlayer.cards.map(card => {
            if (card.id === cardId) {
              const newMatches = [...card.matches];
              newMatches[row][col] = true;
              return { ...card, matches: newMatches };
            }
            return card;
          });
          return { ...prevPlayer, cards: updatedCards };
        });
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleCheckBingo = async (cardId: string) => {
    if (!player || !gameActive) return;

    try {
      const response = await fetch('http://localhost:9001/api/game/check-bingo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: player.id,
          cardId
        }),
      });

      if (!response.ok) {
        throw new Error('Error al verificar el bingo');
      }

      const { hasBingo } = await response.json();
      if (!hasBingo) {
        alert('Aún no tienes bingo. ¡Sigue jugando!');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (error) {
    return <Navigate to="/" replace />;
  }

  if (!player) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="player-view">
      <div className="player-info">
        <h1>¡Bienvenido {player.name}!</h1>
        {hasWon && <h2 className="winner-message">¡Has ganado!</h2>}
      </div>
      
      <BallDisplay currentNumber={currentNumber} />
      
      <div className="cards-container">
        {player.cards.map(card => (
          <BingoCard
            key={card.id}
            card={card}
            onNumberClick={(row, col) => handleNumberClick(card.id, row, col)}
            onClaimBingo={() => handleCheckBingo(card.id)}
            isAdmin={false}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerView; 