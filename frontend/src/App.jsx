import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import { API_BASE_URL } from './config/api';
import BingoCard from './components/BingoCard';
import BallDisplay from './components/BallDisplay';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
`;

const GameContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 2.5em;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background: #fdeaea;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
`;

const App = () => {
  const [currentNumber, setCurrentNumber] = useState(null);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [bingoNumbers, setBingoNumbers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Generar cartón de bingo
    const generateBingoCard = () => {
      const card = [];
      const usedNumbers = new Set();

      // Generar números para cada columna B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)
      for (let i = 0; i < 5; i++) {
        const min = i * 15 + 1;
        const max = min + 14;
        const columnNumbers = [];

        while (columnNumbers.length < 5) {
          const num = Math.floor(Math.random() * (max - min + 1)) + min;
          if (!usedNumbers.has(num)) {
            columnNumbers.push(num);
            usedNumbers.add(num);
          }
        }

        for (let j = 0; j < 5; j++) {
          const index = i + j * 5;
          card[index] = columnNumbers[j];
        }
      }

      // Colocar estrella en el centro
      card[12] = 0; // El índice 12 es el centro del cartón
      return card;
    };

    setBingoNumbers(generateBingoCard());

    // Conectar al servidor de WebSocket
    try {
      const newSocket = io(API_BASE_URL, {
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      newSocket.on('connect', () => {
        setError(null);
        console.log('Conectado al servidor de bingo');
      });

      newSocket.on('connect_error', (err) => {
        setError('Error al conectar con el servidor. Por favor, intente más tarde.');
        console.error('Error de conexión:', err);
      });

      newSocket.on('newNumber', (number) => {
        setCurrentNumber(number);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) newSocket.disconnect();
      };
    } catch (err) {
      setError('Error al inicializar la conexión con el servidor.');
      console.error('Error de inicialización:', err);
    }
  }, []);

  const handleNumberClick = (number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else {
      setSelectedNumbers([...selectedNumbers, number]);
    }
  };

  const checkBingo = () => {
    // Verificar filas
    for (let i = 0; i < 5; i++) {
      const row = bingoNumbers.slice(i * 5, (i + 1) * 5);
      if (row.every(num => selectedNumbers.includes(num) || num === 0)) {
        return true;
      }
    }

    // Verificar columnas
    for (let i = 0; i < 5; i++) {
      const column = [
        bingoNumbers[i],
        bingoNumbers[i + 5],
        bingoNumbers[i + 10],
        bingoNumbers[i + 15],
        bingoNumbers[i + 20]
      ];
      if (column.every(num => selectedNumbers.includes(num) || num === 0)) {
        return true;
      }
    }

    // Verificar diagonales
    const diagonal1 = [
      bingoNumbers[0],
      bingoNumbers[6],
      bingoNumbers[12],
      bingoNumbers[18],
      bingoNumbers[24]
    ];
    const diagonal2 = [
      bingoNumbers[4],
      bingoNumbers[8],
      bingoNumbers[12],
      bingoNumbers[16],
      bingoNumbers[20]
    ];

    if (diagonal1.every(num => selectedNumbers.includes(num) || num === 0) ||
        diagonal2.every(num => selectedNumbers.includes(num) || num === 0)) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (checkBingo()) {
      alert('¡BINGO! ¡Has ganado!');
      if (socket && socket.connected) {
        socket.emit('bingoWon');
      }
    }
  }, [selectedNumbers, socket]);

  return (
    <AppContainer>
      <GameContainer>
        <Title>¡Bingo en Línea!</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <BallDisplay currentNumber={currentNumber} />
        <BingoCard
          numbers={bingoNumbers}
          selectedNumbers={selectedNumbers}
          onNumberClick={handleNumberClick}
        />
      </GameContainer>
    </AppContainer>
  );
};

export default App; 