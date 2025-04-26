
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface Stone {
  x: number;
  y: number;
  color: 'black' | 'white';
}

interface GoBoardProps {
  stones: Stone[];
  currentPlayer: 'black' | 'white';
  canPlaceStone: boolean;
  onPlaceStone: (x: number, y: number) => void;
  winningStones?: Stone[];
}

const GoBoard: React.FC<GoBoardProps> = ({ 
  stones, 
  currentPlayer, 
  canPlaceStone, 
  onPlaceStone,
  winningStones = []
}) => {
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [hoverPosition, setHoverPosition] = useState<{ x: number, y: number } | null>(null);
  
  // Calculate board size on mount and window resize
  useEffect(() => {
    const calculateBoardSize = () => {
      // Make the board square and responsive
      const boardElement = document.getElementById('gomoku-board');
      if (boardElement) {
        const width = boardElement.offsetWidth;
        const height = boardElement.offsetHeight;
        const size = Math.min(width, height);
        setBoardSize({ width: size, height: size });
      }
    };

    calculateBoardSize();
    window.addEventListener('resize', calculateBoardSize);
    
    return () => {
      window.removeEventListener('resize', calculateBoardSize);
    };
  }, []);

  // Get the nearest valid board position from mouse coordinates
  const getNearestPosition = (clientX: number, clientY: number) => {
    const boardElement = document.getElementById('gomoku-board');
    if (!boardElement) return null;

    const boardRect = boardElement.getBoundingClientRect();
    
    // Get relative position within the board
    const relativeX = clientX - boardRect.left;
    const relativeY = clientY - boardRect.top;

    // Calculate board position (0-14)
    const cellSize = boardRect.width / 15;
    const x = Math.round(relativeX / cellSize);
    const y = Math.round(relativeY / cellSize);

    // Ensure position is within board bounds
    if (x < 0 || x > 14 || y < 0 || y > 14) return null;

    return { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canPlaceStone) return;
    
    const position = getNearestPosition(e.clientX, e.clientY);
    setHoverPosition(position);
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!canPlaceStone) return;
    
    const position = getNearestPosition(e.clientX, e.clientY);
    if (position) {
      // Check if position is already occupied
      const isOccupied = stones.some(stone => stone.x === position.x && stone.y === position.y);
      if (!isOccupied) {
        onPlaceStone(position.x, position.y);
      }
    }
  };

  // Check if a position is part of the winning combination
  const isWinningPosition = (x: number, y: number) => {
    return winningStones.some(stone => stone.x === x && stone.y === y);
  };

  // Render star points (dots) on the board
  const renderStarPoints = () => {
    const starPoints = [
      { x: 3, y: 3 }, { x: 3, y: 11 },
      { x: 7, y: 7 },
      { x: 11, y: 3 }, { x: 11, y: 11 }
    ];

    return starPoints.map((point, index) => (
      <div 
        key={`star-${index}`}
        className="dot-marker"
        style={{
          left: `${(point.x / 14) * 100}%`,
          top: `${(point.y / 14) * 100}%`
        }}
      />
    ));
  };

  return (
    <div 
      id="gomoku-board"
      className="gomoku-board relative w-full h-full rounded-md overflow-hidden shadow-lg"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Star points */}
      {renderStarPoints()}

      {/* Stones */}
      {stones.map((stone, index) => (
        <div
          key={`stone-${stone.x}-${stone.y}-${index}`}
          className={cn(
            "gomoku-stone", 
            stone.color,
            isWinningPosition(stone.x, stone.y) && "animate-pulse-stone"
          )}
          style={{
            left: `${(stone.x / 14) * 100}%`,
            top: `${(stone.y / 14) * 100}%`
          }}
        />
      ))}

      {/* Hover position indicator */}
      {hoverPosition && canPlaceStone && !stones.some(
        stone => stone.x === hoverPosition.x && stone.y === hoverPosition.y
      ) && (
        <div 
          className={cn("gomoku-stone opacity-50", currentPlayer)}
          style={{
            left: `${(hoverPosition.x / 14) * 100}%`,
            top: `${(hoverPosition.y / 14) * 100}%`
          }}
        />
      )}
    </div>
  );
};

export default GoBoard;
