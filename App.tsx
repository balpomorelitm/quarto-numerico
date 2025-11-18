import React, { useState, useEffect, useCallback } from 'react';
import { Piece as PieceType, Player, GamePhase, BoardState } from './types';
import { BOARD_SIZE } from './constants';
import { checkWin, isBoardFull } from './services/gameLogic';
import { Board } from './components/Board';
import { PieceBank } from './components/PieceBank';
import { GameInstructions } from './components/GameInstructions';

const generateAllPieces = (): PieceType[] => {
  return Array.from({ length: 16 }, (_, i) => ({
    id: i,
    isTall: (i & 8) === 8,
    isBlack: (i & 4) === 4,
    isSquare: (i & 2) === 2,
    isHollow: (i & 1) === 1,
    number: 0, // Assigned after shuffling
  }));
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const createEmptyBoard = (): BoardState =>
  Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));

const App: React.FC = () => {
  const [allPieces, setAllPieces] = useState<PieceType[]>([]);
  const [board, setBoard] = useState<BoardState>([]);
  const [availablePieces, setAvailablePieces] = useState<PieceType[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<PieceType | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('Player 1');
  const [gamePhase, setGamePhase] = useState<GamePhase>('CHOOSING');
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [gameMessage, setGameMessage] = useState('');

  const initializeGame = useCallback(() => {
    const initialPieces = generateAllPieces();
    const shuffledNumbers = shuffleArray(Array.from({ length: 16 }, (_, i) => i + 1));
    const piecesWithNumbers = initialPieces.map((p, i) => ({ ...p, number: shuffledNumbers[i] }));
    
    setAllPieces(piecesWithNumbers);
    setBoard(createEmptyBoard());
    setAvailablePieces(piecesWithNumbers);
    setSelectedPiece(null);
    setCurrentPlayer('Player 1');
    setGamePhase('CHOOSING');
    setWinner(null);
    setGameMessage('Player 1, choose a piece for Player 2.');
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (winner) {
        if (winner === 'DRAW') {
            setGameMessage("It's a draw! No more moves possible.");
        } else {
            setGameMessage(`¡QUARTO! ${winner} wins!`);
        }
        setGamePhase('GAME_OVER');
    } else {
        const opponent = currentPlayer === 'Player 1' ? 'Player 2' : 'Player 1';
        if (gamePhase === 'CHOOSING') {
            setGameMessage(`${currentPlayer}, choose a piece for ${opponent}.`);
        } else if (gamePhase === 'PLACING') {
            setGameMessage(`${currentPlayer}, place the chosen piece.`);
        }
    }
  }, [currentPlayer, gamePhase, winner]);


  const handlePieceSelect = (piece: PieceType) => {
    if (gamePhase !== 'CHOOSING' || winner) return;

    setSelectedPiece(piece);
    setAvailablePieces(prev => prev.filter(p => p.id !== piece.id));
    const nextPlayer = currentPlayer === 'Player 1' ? 'Player 2' : 'Player 1';
    setCurrentPlayer(nextPlayer);
    setGamePhase('PLACING');
  };

  const handleCellClick = (row: number, col: number) => {
    if (gamePhase !== 'PLACING' || !selectedPiece || winner) return;
    if (board[row][col]) {
      setGameMessage('That square is already occupied. Choose an empty one.');
      return;
    }

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = selectedPiece;
    setBoard(newBoard);
    setSelectedPiece(null);

    if (checkWin(newBoard)) {
        setWinner(currentPlayer);
    } else if (isBoardFull(newBoard)) {
        setWinner('DRAW');
    } else {
        setGamePhase('CHOOSING');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
            Quarto: <span className="text-cyan-400">Spanish Numbers</span>
          </h1>
        </header>

        <main className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow lg:w-2/3">
                <div className="mb-4 p-4 bg-gray-800 rounded-lg shadow-lg text-center min-h-[110px] flex flex-col justify-center items-center">
                    {winner ? (
                        <div className="animate-fade-in">
                            <p className="text-3xl font-extrabold text-yellow-400">{gameMessage}</p>
                            <button 
                                onClick={initializeGame} 
                                className="mt-4 px-8 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg shadow-md transition-transform transform hover:scale-105"
                            >
                                Play Again
                            </button>
                        </div>
                    ) : (
                        <p className="text-xl font-medium text-gray-200 animate-fade-in" key={gameMessage}>{gameMessage}</p>
                    )}
                </div>
                <Board board={board} onCellClick={handleCellClick} isDisabled={gamePhase !== 'PLACING'} />
            </div>

            <aside className="w-full lg:w-1/3">
                <PieceBank 
                    pieces={availablePieces} 
                    onPieceSelect={handlePieceSelect} 
                    selectedPiece={selectedPiece} 
                    isDisabled={gamePhase !== 'CHOOSING'} 
                />
                <GameInstructions />
            </aside>
        </main>
      </div>
    </div>
  );
};

export default App;