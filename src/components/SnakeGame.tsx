import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, Play, Pause } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Direction {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 150;

export const SnakeGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood());
    setGameOver(false);
    setScore(0);
    setIsPlaying(false);
    setGameStarted(false);
  }, [generateFood]);

  const checkCollision = useCallback((head: Position, snakeBody: Position[]) => {
    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    // Check self collision
    for (const segment of snakeBody) {
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }
    
    return false;
  }, []);

  const moveSnake = useCallback(() => {
    if (!isPlaying || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.y += direction.y;

      if (checkCollision(head, newSnake)) {
        setGameOver(true);
        setIsPlaying(false);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prevScore => prevScore + 10);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isPlaying, gameOver, checkCollision, generateFood]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;

    const key = e.key.toLowerCase();
    
    // Start game if not started
    if (!gameStarted && (key === 'w' || key === 's' || key === 'a' || key === 'd' || 
                         key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright')) {
      setGameStarted(true);
      setIsPlaying(true);
    }

    if (!isPlaying) return;

    switch (key) {
      case 'w':
      case 'arrowup':
        if (direction.y !== 1) setDirection({ x: 0, y: -1 });
        break;
      case 's':
      case 'arrowdown':
        if (direction.y !== -1) setDirection({ x: 0, y: 1 });
        break;
      case 'a':
      case 'arrowleft':
        if (direction.x !== 1) setDirection({ x: -1, y: 0 });
        break;
      case 'd':
      case 'arrowright':
        if (direction.x !== -1) setDirection({ x: 1, y: 0 });
        break;
    }
  }, [direction, gameOver, isPlaying, gameStarted]);

  const togglePause = () => {
    if (!gameStarted) return;
    setIsPlaying(!isPlaying);
  };

  const startGame = () => {
    setGameStarted(true);
    setIsPlaying(true);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [moveSnake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'hsl(var(--game-bg))';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'hsl(var(--grid-line))';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * (canvas.width / GRID_SIZE), 0);
      ctx.lineTo(i * (canvas.width / GRID_SIZE), canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * (canvas.height / GRID_SIZE));
      ctx.lineTo(canvas.width, i * (canvas.height / GRID_SIZE));
      ctx.stroke();
    }

    const cellSize = canvas.width / GRID_SIZE;

    // Draw food
    ctx.fillStyle = 'hsl(var(--food-color))';
    ctx.shadowColor = 'hsl(var(--food-color))';
    ctx.shadowBlur = 10;
    ctx.fillRect(
      food.x * cellSize + 2,
      food.y * cellSize + 2,
      cellSize - 4,
      cellSize - 4
    );
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = 'hsl(var(--snake-primary))';
        ctx.shadowColor = 'hsl(var(--snake-primary))';
        ctx.shadowBlur = 15;
      } else {
        // Body
        ctx.fillStyle = 'hsl(var(--snake-secondary))';
        ctx.shadowBlur = 5;
      }
      
      ctx.fillRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
    ctx.shadowBlur = 0;
  }, [snake, food]);

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-gradient-game min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 shadow-neon">
          Jogo da Cobrinha
        </h1>
        <p className="text-muted-foreground">
          Use WASD ou as setas para mover a cobrinha
        </p>
      </div>

      <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold text-primary">
            Pontuação: <span className="animate-score-pop">{score}</span>
          </div>
          <div className="flex gap-2">
            {gameStarted && (
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
                className="border-primary/20 hover:bg-primary/10"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetGame}
              className="border-primary/20 hover:bg-primary/10"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="border-2 border-primary/30 rounded-lg bg-game-bg shadow-glow"
          />
          
          {!gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Pressione uma tecla para começar
                </h3>
                <p className="text-muted-foreground mb-4">WASD ou Setas</p>
                <Button onClick={startGame} className="bg-gradient-ui shadow-neon">
                  <Play className="w-4 h-4 mr-2" />
                  Jogar
                </Button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg animate-game-over">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-destructive mb-2">
                  Game Over!
                </h3>
                <p className="text-foreground mb-2">Pontuação Final: {score}</p>
                <Button onClick={resetGame} className="bg-gradient-ui shadow-neon">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Jogar Novamente
                </Button>
              </div>
            </div>
          )}

          {isPlaying && gameStarted && !gameOver && (
            <div className="absolute top-2 right-2 text-sm text-muted-foreground">
              ESC para pausar
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Movimento:</strong><br />
              W/↑ - Cima<br />
              S/↓ - Baixo
            </div>
            <div>
              A/← - Esquerda<br />
              D/→ - Direita
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};