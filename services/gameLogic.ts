
import { Piece, BoardState } from '../types';
import { BOARD_SIZE } from '../constants';

const checkLine = (line: (Piece | null)[]): boolean => {
  if (line.some(p => p === null)) {
    return false; // The line is not full, so it cannot be a winning line.
  }

  // We can now safely cast because we've checked for nulls.
  const pieces = line as Piece[];

  const attributes: (keyof Piece)[] = ['isTall', 'isBlack', 'isSquare', 'isHollow'];

  for (const attr of attributes) {
    // Check if all pieces in the line share the positive attribute (e.g., all are tall)
    if (pieces.every(p => p[attr])) {
      return true;
    }
    // Check if all pieces in the line share the negative attribute (e.g., all are short)
    if (pieces.every(p => !p[attr])) {
      return true;
    }
  }

  return false;
};

export const checkWin = (board: BoardState): boolean => {
  // Check rows
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (checkLine(board[i])) {
      return true;
    }
  }

  // Check columns
  for (let i = 0; i < BOARD_SIZE; i++) {
    const column = board.map(row => row[i]);
    if (checkLine(column)) {
      return true;
    }
  }

  // Check diagonals
  const diagonal1 = Array.from({ length: BOARD_SIZE }, (_, i) => board[i][i]);
  if (checkLine(diagonal1)) {
    return true;
  }

  const diagonal2 = Array.from({ length: BOARD_SIZE }, (_, i) => board[i][BOARD_SIZE - 1 - i]);
  if (checkLine(diagonal2)) {
    return true;
  }

  return false;
};

export const isBoardFull = (board: BoardState): boolean => {
    return board.every(row => row.every(cell => cell !== null));
}
