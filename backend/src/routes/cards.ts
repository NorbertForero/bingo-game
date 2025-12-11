import { Router } from 'express';

const router = Router();

interface BingoCard {
  numbers: number[][];
}

function generateRandomNumber(min: number, max: number, usedNumbers: Set<number>): number {
  let number;
  do {
    number = Math.floor(Math.random() * (max - min + 1)) + min;
  } while (usedNumbers.has(number));
  usedNumbers.add(number);
  return number;
}

function generateBingoCard(): BingoCard {
  const usedNumbers: Set<number> = new Set();
  const numbers: number[][] = [];
  
  // Rangos para cada columna
  const columnRanges = [
    { min: 1, max: 15 },   // B (1-15)
    { min: 16, max: 30 },  // I (16-30)
    { min: 31, max: 45 },  // N (31-45)
    { min: 46, max: 60 },  // G (46-60)
    { min: 61, max: 75 }   // O (61-75)
  ];

  // Generar números para cada columna
  for (let row = 0; row < 5; row++) {
    const currentRow: number[] = [];
    for (let col = 0; col < 5; col++) {
      const { min, max } = columnRanges[col];
      const number = generateRandomNumber(min, max, usedNumbers);
      currentRow.push(number);
    }
    numbers.push(currentRow);
  }

  return { numbers };
}

router.post('/generate', (req, res) => {
  try {
    const count = req.body.count || 8;
    const cards: BingoCard[] = [];

    for (let i = 0; i < count; i++) {
      cards.push(generateBingoCard());
    }

    res.json({ cards: cards.map(card => card.numbers) });
  } catch (error) {
    console.error('Error generando cartones:', error);
    res.status(500).json({ error: 'Error generando cartones de bingo' });
  }
});

export default router; 