import React from 'react';
import { Piece as PieceType } from '../types';
import { Piece } from './Piece';

interface PieceBankProps {
  pieces: PieceType[];
  onPieceSelect: (piece: PieceType) => void;
  selectedPiece: PieceType | null;
  isDisabled: boolean;
}

export const PieceBank: React.FC<PieceBankProps> = ({ pieces, onPieceSelect, selectedPiece, isDisabled }) => {
  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-inner w-full">
        <h3 className="text-xl font-bold text-center mb-4 text-gray-300">Available Pieces</h3>
        {pieces.length > 0 ? (
             <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-4 gap-x-2 gap-y-8">
                {pieces.map((p) => (
                <div key={p.id} className="flex justify-center">
                    <Piece
                        piece={p}
                        onClick={onPieceSelect}
                        isSelected={selectedPiece?.id === p.id}
                        isDisabled={isDisabled}
                        size="small"
                    />
                </div>
                ))}
            </div>
        ) : (
            <p className="text-center text-gray-400 italic">No pieces left.</p>
        )}
    </div>
  );
};