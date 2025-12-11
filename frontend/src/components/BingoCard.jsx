import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 400px;
  margin: 20px auto;
`;

const Title = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  
  span {
    font-size: 2.5em;
    font-weight: bold;
    letter-spacing: 5px;
    
    &:nth-child(1) { color: #FF6B6B; }
    &:nth-child(2) { color: #FFD93D; }
    &:nth-child(3) { color: #6BCB77; }
    &:nth-child(4) { color: #4D96FF; }
    &:nth-child(5) { color: #9B59B6; }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 20px;
`;

const Cell = styled.div`
  background: ${props => props.isSelected ? '#4CAF50' : '#fff'};
  color: ${props => props.isSelected ? '#fff' : '#333'};
  border: 2px solid #ddd;
  border-radius: 5px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.isSelected ? '#45a049' : '#f5f5f5'};
  }
`;

const BingoCard = ({ numbers, selectedNumbers, onNumberClick }) => {
  const letters = ['B', 'I', 'N', 'G', 'O'];

  return (
    <CardContainer>
      <Title>
        {letters.map((letter, index) => (
          <span key={index}>{letter}</span>
        ))}
      </Title>
      <Grid>
        {letters.map((letter, i) => (
          <Cell key={`header-${i}`} style={{ background: '#f0f0f0' }}>
            {letter}
          </Cell>
        ))}
        {numbers.map((number, index) => (
          <Cell
            key={index}
            isSelected={selectedNumbers.includes(number)}
            onClick={() => onNumberClick(number)}
          >
            {number === 0 ? '★' : number}
          </Cell>
        ))}
      </Grid>
    </CardContainer>
  );
};

export default BingoCard; 