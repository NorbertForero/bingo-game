import React from 'react';
import styled from 'styled-components';

const BallContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
`;

const Ball = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin: 10px;
  animation: bounce 0.5s ease;

  @keyframes bounce {
    0% { transform: scale(0.3); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;

const Label = styled.div`
  font-size: 1.2em;
  color: #666;
  margin-top: 10px;
`;

const BallDisplay = ({ currentNumber }) => {
  const getLetterForNumber = (number) => {
    if (number <= 15) return 'B';
    if (number <= 30) return 'I';
    if (number <= 45) return 'N';
    if (number <= 60) return 'G';
    return 'O';
  };

  return (
    <BallContainer>
      <Label>Última balota:</Label>
      <Ball>
        {currentNumber ? `${getLetterForNumber(currentNumber)}-${currentNumber}` : '?'}
      </Ball>
    </BallContainer>
  );
};

export default BallDisplay; 