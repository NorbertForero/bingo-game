export interface BingoCard {
  id: string;
  numbers: number[][];
  matches: boolean[][];
  isComplete: boolean;
}

export interface User {
  id: string;
  isAdmin: boolean;
  cards: BingoCard[];
}

export interface GameState {
  currentNumber: number | null;
  drawnNumbers: number[];
  bingoClaimedBy: string | null;
  isValidating: boolean;
} 