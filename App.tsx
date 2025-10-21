
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Point, Direction } from './types';
import { useGameLoop } from './hooks/useGameLoop';

const GRID_SIZE = 20;
const CELL_SIZE = 25; // in pixels
const INITIAL_SPEED = 200;
const SPEED_INCREMENT = 5;

const getRandomCoordinate = (existingPoints: Point[] = []): Point => {
  let newPoint: Point;
  do {
    newPoint = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (existingPoints.some(p => p.x === newPoint.x && p.y === newPoint.y));
  return newPoint;
};

const GameUI = ({ score, onRestart }: { score: number; onRestart: () => void }) => (
  <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 text-white">
    <h1 className="text-3xl font-bold text-cyan-400 tracking-widest uppercase" style={{ textShadow: '0 0 10px #06b6d4' }}>
      3D Neon Snake
    </h1>
    <div className="flex items-center gap-6">
      <div className="text-2xl">
        Score: <span className="font-bold text-fuchsia-400">{score}</span>
      </div>
      <button
        onClick={onRestart}
        className="px-4 py-2 bg-fuchsia-500 text-white font-bold rounded-md transition-all duration-300 hover:bg-fuchsia-600 hover:shadow-[0_0_20px_#d946ef] active:scale-95"
      >
        Restart
      </button>
    </div>
  </div>
);

const GameOverScreen = ({ score, onRestart }: { score: number; onRestart: () => void }) => (
  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 backdrop-blur-sm">
    <div className="text-center text-white p-8 border-2 border-fuchsia-500 bg-gray-900/50 rounded-xl shadow-[0_0_30px_#d946ef]">
      <h2 className="text-5xl font-bold mb-4 uppercase">Game Over</h2>
      <p className="text-2xl mb-6">Final Score: <span className="font-bold text-cyan-400">{score}</span></p>
      <button
        onClick={onRestart}
        className="px-6 py-3 bg-fuchsia-500 text-white font-bold text-xl rounded-md transition-all duration-300 hover:bg-fuchsia-600 hover:shadow-[0_0_20px_#d946ef] active:scale-95"
      >
        Play Again
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const getInitialSnake = () => [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];

  const [snake, setSnake] = useState<Point[]>(getInitialSnake);
  const [food, setFood] = useState<Point>(getRandomCoordinate(snake));
  const [direction, setDirection] = useState<Direction>(Direction.UP);
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  const directionRef = useRef(direction);

  const resetGame = useCallback(() => {
    const newSnake = getInitialSnake();
    setSnake(newSnake);
    setFood(getRandomCoordinate(newSnake));
    setDirection(Direction.UP);
    directionRef.current = Direction.UP;
    setSpeed(INITIAL_SPEED);
    setScore(0);
    setIsGameOver(false);
    setIsRunning(true);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const keyMap: { [key: string]: Direction } = {
      ArrowUp: Direction.UP, w: Direction.UP,
      ArrowDown: Direction.DOWN, s: Direction.DOWN,
      ArrowLeft: Direction.LEFT, a: Direction.LEFT,
      ArrowRight: Direction.RIGHT, d: Direction.RIGHT,
    };
    const newDirection = keyMap[e.key];

    if (newDirection !== undefined) {
      const currentDirection = directionRef.current;
      const isOpposite = (
        (newDirection === Direction.UP && currentDirection === Direction.DOWN) ||
        (newDirection === Direction.DOWN && currentDirection === Direction.UP) ||
        (newDirection === Direction.LEFT && currentDirection === Direction.RIGHT) ||
        (newDirection === Direction.RIGHT && currentDirection === Direction.LEFT)
      );
      if (!isOpposite) {
        directionRef.current = newDirection;
      }
    } else if (e.key === ' ') {
        setIsRunning(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const gameTick = useCallback(() => {
    if (isGameOver || !isRunning) return;
    setDirection(directionRef.current);

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (directionRef.current) {
        case Direction.UP: head.y -= 1; break;
        case Direction.DOWN: head.y += 1; break;
        case Direction.LEFT: head.x -= 1; break;
        case Direction.RIGHT: head.x += 1; break;
      }
      
      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setIsGameOver(true);
        setIsRunning(false);
        return prevSnake;
      }

      // Self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setIsGameOver(true);
        setIsRunning(false);
        return prevSnake;
      }

      newSnake.unshift(head);

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prevScore => prevScore + 10);
        setFood(getRandomCoordinate(newSnake));
        setSpeed(prevSpeed => Math.max(50, prevSpeed - SPEED_INCREMENT));
      } else {
        newSnake.pop();
      }
      
      return newSnake;
    });

  }, [food, isGameOver, isRunning]);

  useGameLoop(gameTick, isRunning && !isGameOver ? speed : null);

  const gridStyle = {
    width: `${GRID_SIZE * CELL_SIZE}px`,
    height: `${GRID_SIZE * CELL_SIZE}px`,
    backgroundImage: `
      linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
    `,
    backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center text-white overflow-hidden relative" style={{ perspective: '1000px' }}>
      <GameUI score={score} onRestart={resetGame} />
      {isGameOver && <GameOverScreen score={score} onRestart={resetGame} />}
      
      <div 
        className="relative border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.5)]"
        style={{...gridStyle, transformStyle: 'preserve-3d', transform: 'rotateX(55deg)' }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-md ${index === 0 ? 'bg-fuchsia-500' : 'bg-cyan-400'} border-b-4 ${index === 0 ? 'border-fuchsia-700' : 'border-cyan-600'} transition-all duration-100`}
            style={{
              left: `${segment.x * CELL_SIZE}px`,
              top: `${segment.y * CELL_SIZE}px`,
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              boxShadow: `0 0 10px ${index === 0 ? 'rgba(217, 70, 239, 0.8)' : 'rgba(6, 182, 212, 0.6)'}`,
              transform: 'translateZ(8px)'
            }}
          />
        ))}
        <div
          className="absolute bg-pink-500 rounded-full animate-pulse"
          style={{
            left: `${food.x * CELL_SIZE}px`,
            top: `${food.y * CELL_SIZE}px`,
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            boxShadow: '0 0 20px rgba(236, 72, 153, 1)',
            transform: 'translateZ(8px)'
          }}
        />
      </div>
      <div className="mt-12 text-center text-gray-400 text-sm">
          <p>Use Arrow Keys or WASD to move. Press Space to pause/resume.</p>
      </div>
    </div>
  );
};

export default App;
