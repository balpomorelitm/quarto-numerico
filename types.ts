
export interface Piece {
  id: number;
  isTall: boolean;
  isBlack: boolean;
  isSquare: boolean;
  isHollow: boolean;
  number: number;
}

export type Player = 'Player 1' | 'Player 2';

export type GamePhase = 'CHOOSING' | 'PLACING' | 'GAME_OVER';

export type BoardState = (Piece | null)[][];
