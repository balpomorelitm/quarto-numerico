import React from 'react';
import { Piece as PieceType } from '../types';
import { Piece } from './Piece';

// Example pieces to illustrate attributes. Numbers are irrelevant here.
const examplePieces: { [key: string]: PieceType } = {
  tallSquareSolidWhite: { id: 100, isTall: true, isBlack: false, isSquare: true, isHollow: false, number: 0 },
  shortSquareSolidWhite: { id: 101, isTall: false, isBlack: false, isSquare: true, isHollow: false, number: 0 },
  
  blackRoundHollowShort: { id: 102, isTall: false, isBlack: true, isSquare: false, isHollow: true, number: 0 },
  whiteRoundHollowShort: { id: 103, isTall: false, isBlack: false, isSquare: false, isHollow: true, number: 0 },

  squareTallSolidBlack: { id: 104, isTall: true, isBlack: true, isSquare: true, isHollow: false, number: 0 },
  roundTallSolidBlack: { id: 105, isTall: true, isBlack: true, isSquare: false, isHollow: false, number: 0 },

  hollowSquareWhiteShort: { id: 106, isTall: false, isBlack: false, isSquare: true, isHollow: true, number: 0 },
  solidSquareWhiteShort: { id: 107, isTall: false, isBlack: false, isSquare: true, isHollow: false, number: 0 },
};

const AttributeExplanation: React.FC<{ title: string, piece1: PieceType, piece2: PieceType }> = ({ title, piece1, piece2 }) => (
    <div className="flex items-center gap-4 py-3 border-b border-gray-700 last:border-b-0">
        <div className="flex-shrink-0 flex gap-2">
            <Piece piece={piece1} size="small" />
            <Piece piece={piece2} size="small" />
        </div>
        <p className="text-sm text-gray-300 font-medium">{title}</p>
    </div>
);


export const GameInstructions: React.FC = () => {
    return (
        <div className="p-4 bg-gray-800 rounded-lg shadow-inner mt-8 animate-fade-in">
            <h3 className="text-xl font-bold text-center mb-4 text-cyan-400">Game Rules</h3>

            <div className="space-y-4 text-gray-300">
                <div>
                    <h4 className="font-bold text-white mb-1">The Goal</h4>
                    <p className="text-sm">Be the first player to place the 4th piece in a line (row, column, or diagonal) where all four pieces share at least one common attribute.</p>
                </div>
                 <div>
                    <h4 className="font-bold text-white mb-1">The Twist</h4>
                    <p className="text-sm">You don't choose the piece you play! On your turn, your <span className="text-yellow-400 font-semibold">opponent chooses a piece</span> from the bank for you to place on the board.</p>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-2">The Four Attributes</h4>
                    <div className="flex flex-col">
                        <AttributeExplanation title="Tall vs. Short" piece1={examplePieces.tallSquareSolidWhite} piece2={examplePieces.shortSquareSolidWhite} />
                        <AttributeExplanation title="Black vs. White" piece1={examplePieces.blackRoundHollowShort} piece2={examplePieces.whiteRoundHollowShort} />
                        <AttributeExplanation title="Square vs. Round" piece1={examplePieces.squareTallSolidBlack} piece2={examplePieces.roundTallSolidBlack} />
                        <AttributeExplanation title="Hollow vs. Solid" piece1={examplePieces.hollowSquareWhiteShort} piece2={examplePieces.solidSquareWhiteShort} />
                    </div>
                </div>
            </div>
        </div>
    );
};