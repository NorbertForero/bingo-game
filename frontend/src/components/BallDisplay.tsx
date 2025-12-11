import React from 'react';
import './BallDisplay.css';

interface BallDisplayProps {
  currentNumber: number | null;
}

const BallDisplay: React.FC<BallDisplayProps> = ({ currentNumber }) => {
  return (
    <div className="ball-display">
      <h2>Última balota:</h2>
      <div className="ball">
        {currentNumber === null ? '?' : currentNumber}
      </div>
      <div className="bingo-title">
        <span style={{ color: '#FF6B6B' }}>B</span>
        <span style={{ color: '#4ECDC4' }}>I</span>
        <span style={{ color: '#FFD93D' }}>N</span>
        <span style={{ color: '#95E1D3' }}>G</span>
        <span style={{ color: '#A8E6CF' }}>O</span>
      </div>
    </div>
  );
};

export default BallDisplay; 