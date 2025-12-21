import React from 'react';
import './BallotDrum.css';

interface BallotDrumProps {
  isSpinning: boolean;
  currentNumber: number | null;
  currentColumn: string | null;
  calledNumbers: number[];
}

export const BallotDrum: React.FC<BallotDrumProps> = ({ 
  isSpinning, 
  currentNumber,
  currentColumn
}) => {
  return (
    <div className={`ballot-drum ${isSpinning ? 'spinning' : ''}`}>
      <div className="drum-container">
        <div className="drum-cage" />
        <div className="drum-cage-circles">
          <div className="drum-cage-circle" />
          <div className="drum-cage-circle" />
          <div className="drum-cage-circle" />
          <div className="drum-cage-circle" />
        </div>
      </div>
      {currentNumber && !isSpinning && (
        <div className="current-ballot">
          <div className="selected-ball">
            {currentColumn && <span className="ball-letter">{currentColumn}</span>}
            <span className="ball-number">{currentNumber}</span>
          </div>
        </div>
      )}
    </div>
  );
}; 