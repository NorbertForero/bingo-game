import React, { useState, useEffect } from 'react';
import { Manager } from 'socket.io-client';
import { Socket } from 'socket.io-client';
import './AdminView.css';

interface BingoNumber {
  number: number;
  called: boolean;
}

const AdminView: React.FC = () => {
  const [numbers, setNumbers] = useState<BingoNumber[]>(
    Array.from({ length: 75 }, (_, i) => ({ 
      number: i + 1, 
      called: false 
    }))
  );
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [socket, setSocket] = useState<typeof Socket | null>(null);

  useEffect(() => {
    const manager = new Manager('http://localhost:9001');
    const newSocket = manager.socket('/');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    let intervalId: NodeJS.Timeout;

    const startCalling = () => {
      const availableNumbers = numbers.filter(n => !n.called).map(n => n.number);
      
      if (availableNumbers.length === 0) {
        setIsGameActive(false);
        return;
      }

      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const number = availableNumbers[randomIndex];
      
      setCurrentNumber(number);
      setNumbers(prev => prev.map(n => 
        n.number === number ? { ...n, called: true } : n
      ));
      
      socket.emit('numberCalled', number);
    };

    if (isGameActive) {
      intervalId = setInterval(startCalling, 30000);
      socket.emit('gameStarted');
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isGameActive, numbers, socket]);

  const handleStartGame = () => {
    setIsGameActive(true);
    setNumbers(numbers.map(n => ({ ...n, called: false })));
    setCurrentNumber(null);
  };

  const handleStopGame = () => {
    setIsGameActive(false);
  };

  const getNumberColor = (number: number): string => {
    if (number >= 1 && number <= 15) return '#FF6B6B';  // B
    if (number >= 16 && number <= 30) return '#4ECDC4'; // I
    if (number >= 31 && number <= 45) return '#FFD93D'; // N
    if (number >= 46 && number <= 60) return '#95E1D3'; // G
    return '#A8E6CF';  // O
  };

  return (
    <div className="admin-view">
      <h1>Panel de Administrador</h1>
      
      <div className="current-number">
        <h2>Última balota:</h2>
        {currentNumber && (
          <div 
            className="ball"
            style={{ backgroundColor: getNumberColor(currentNumber) }}
          >
            {currentNumber}
          </div>
        )}
      </div>

      <div className="game-controls">
        {!isGameActive ? (
          <button className="start-button" onClick={handleStartGame}>
            Iniciar Juego
          </button>
        ) : (
          <button className="stop-button" onClick={handleStopGame}>
            Detener Juego
          </button>
        )}
      </div>

      <div className="number-board">
        {numbers.map(({ number, called }) => (
          <div 
            key={number}
            className={`board-number ${called ? 'called' : ''}`}
            style={{ 
              backgroundColor: called ? getNumberColor(number) : 'white',
              color: called ? 'white' : '#333'
            }}
          >
            {number}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminView; 