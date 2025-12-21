import React from 'react';
import './BingoCard.css';

interface BingoCardProps {
  card: {
    id: string;
    numbers: number[][];
    matches: boolean[][];
    isComplete: boolean;
    calledNumbers?: number[];
  };
  onNumberClick: (row: number, col: number) => void;
  onClaimBingo: (cardId: string) => void;
  isAdmin: boolean;
}

export const BingoCard: React.FC<BingoCardProps> = ({ 
  card, 
  onNumberClick, 
  onClaimBingo,
  isAdmin 
}) => {
  const headers = ['B', 'I', 'N', 'G', 'O'];

  const isNumberCalled = (number: number) => {
    return card.calledNumbers?.includes(number) || false;
  };

  const renderReferenceCard = () => {
    return (
      <div className="bingo-card bingo-card-admin">
        <div className="bingo-header">
          {headers.map((letter, index) => (
            <div key={index} className="header-cell">{letter}</div>
          ))}
        </div>
        <div className="bingo-grid">
          {[...Array(15)].map((_, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {headers.map((_, colIndex) => {
                const number = colIndex * 15 + rowIndex + 1;
                const called = isNumberCalled(number);
                return (
                  <div
                    key={number}
                    className={`bingo-cell ${called ? 'matched' : ''}`}
                  >
                    {number}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderRegularCard = () => {
    return (
      <div className="bingo-card bingo-card-player">
        <div className="card-title">Cartón #{card.id}</div>
        <div className="bingo-header">
          {headers.map((letter, index) => (
            <div key={index} className="header-cell">{letter}</div>
          ))}
        </div>
        <div className="bingo-grid">
          {card.numbers.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {row.map((number, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`bingo-cell ${card.matches[rowIndex][colIndex] ? 'matched' : ''}`}
                  onClick={() => !isAdmin && onNumberClick(rowIndex, colIndex)}
                >
                  {number}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        {!isAdmin && card.isComplete && (
          <button 
            className="bingo-button"
            onClick={() => onClaimBingo(card.id)}
          >
            ¡BINGO!
          </button>
        )}
      </div>
    );
  };

  return isAdmin ? renderReferenceCard() : renderRegularCard();
}; 