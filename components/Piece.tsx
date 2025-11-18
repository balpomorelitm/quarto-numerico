import React from 'react';
import { Piece as PieceType } from '../types';
import { speakSpanishNumber } from '../services/audioService';

interface PieceProps {
  piece: PieceType;
  onClick?: (piece: PieceType) => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  size?: 'small' | 'large';
}

const SpeakerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || 'w-6 h-6'}>
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 0 1 1.06 0c3.099 3.099 3.099 8.134 0 11.232a.75.75 0 0 1-1.06-1.06 6.704 6.704 0 0 0 0-9.112.75.75 0 0 1 0-1.06z" />
        <path d="M16.416 7.274a.75.75 0 0 1 1.06 0c1.55 1.55 1.55 4.072 0 5.622a.75.75 0 1 1-1.06-1.06 2.57 2.57 0 0 0 0-3.502.75.75 0 0 1 0-1.06z" />
    </svg>
);


export const Piece: React.FC<PieceProps> = ({ piece, onClick, isSelected = false, isDisabled = false, size = 'large' }) => {
  const handlePieceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick && !isDisabled) {
      onClick(piece);
    }
  };

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (piece.number > 0) {
      speakSpanishNumber(piece.number);
    }
  };

  const showNumberAndAudio = piece.number > 0;

  const sizeClasses = size === 'large' 
    ? 'w-20 h-20 md:w-24 md:h-24' 
    : 'w-14 h-14';
  
  const baseClasses = `relative flex items-center justify-center transition-all duration-300 ease-in-out transform group ${sizeClasses}`;
  const shapeClass = piece.isSquare ? 'rounded-xl' : 'rounded-full';
  
  // --- START: Updated color logic ---
  let colorClass = '';
  let topClass = '';
  let audioIconColor = '';

  if (piece.isHollow) {
    // Hollow pieces have a yellow interior and a colored border (black or white)
    colorClass = 'bg-yellow-500'; 
    const borderColor = piece.isBlack ? 'border-gray-700' : 'border-gray-100';
    topClass = `${borderColor} border-[8px] md:border-[12px]`;
    // On a yellow background, the icon should be dark for contrast
    audioIconColor = 'text-gray-800 hover:text-black';
  } else {
    // Solid pieces just have a background color
    colorClass = piece.isBlack ? 'bg-gray-700' : 'bg-gray-100';
    topClass = ''; // No border for solid pieces
    // Icon color depends on the solid piece color
    audioIconColor = piece.isBlack ? 'text-gray-300 hover:text-yellow-400' : 'text-gray-600 hover:text-black';
  }
  // --- END: Updated color logic ---

  const heightClass = piece.isTall ? 'scale-105 shadow-2xl' : 'scale-95 shadow-lg';
  const selectionClass = isSelected ? 'ring-4 ring-offset-4 ring-offset-gray-900 ring-yellow-400' : '';
  const disabledClass = isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-110 hover:shadow-cyan-500/30';
  const numberColor = 'text-yellow-400';
  const numberSize = size === 'large' ? 'text-2xl md:text-3xl' : 'text-xl';

  return (
    <div className="relative flex flex-col items-center gap-y-2">
      <span className={`font-extrabold ${numberColor} ${numberSize} ${!showNumberAndAudio ? 'invisible' : ''}`}>
        {/* Render a placeholder number to maintain height, but keep it invisible */}
        {showNumberAndAudio ? piece.number : '0'}
      </span>
      <div
        className={`${baseClasses} ${shapeClass} ${heightClass} ${onClick ? disabledClass : ''} ${selectionClass}`}
        onClick={handlePieceClick}
        title={showNumberAndAudio ? `Piece #${piece.number}` : 'Example piece'}
      >
        <div className={`absolute inset-0 ${shapeClass} ${colorClass} ${topClass}`}></div>
        {showNumberAndAudio && (
          <div className="relative z-10">
            <button 
              onClick={handleAudioClick}
              className={`p-1 rounded-full transition-colors opacity-60 group-hover:opacity-100 ${audioIconColor}`}
              title={`Say number ${piece.number} in Spanish`}
            >
              <SpeakerIcon className="w-5 h-5 md:w-6 md:h-6"/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};