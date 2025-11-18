import React from 'react';
import { BoardState } from '../types';
import { Piece } from './Piece';

interface BoardProps {
  board: BoardState;
  onCellClick: (row: number, col: number) => void;
  isDisabled: boolean;
}

export const Board: React.FC<BoardProps> = ({ board, onCellClick, isDisabled }) => {
  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-inner">
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="w-24 h-36 md:w-28 md:h-40 bg-gray-700/50 rounded-lg flex items-center justify-center"
            >
              {piece ? (
                <Piece piece={piece} />
              ) : (
                <button
                  onClick={() => onCellClick(rowIndex, colIndex)}
                  disabled={isDisabled}
                  className="w-full h-full rounded-lg transition-colors duration-200 hover:bg-cyan-500/20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  aria-label={`Place piece at row ${rowIndex + 1}, column ${colIndex + 1}`}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};