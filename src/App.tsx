import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Game } from './game/core/Game'
import type { StageInfo } from './game/systems/StageSystem'

const HIGH_SCORE_KEY = 'vapor-wave-high-score'
const INITIAL_STAGE: StageInfo = {
  id: 'easy',
  name: 'Fácil',
  color: '#00b7ff',
  minScore: 0,
  targetScore: 500,
}

function loadHighScore(): number {
  try {
    const stored = Number(localStorage.getItem(HIGH_SCORE_KEY))
    return Number.isFinite(stored) && stored > 0 ? stored : 0
  } catch {
    return 0
  }
}

function saveHighScore(score: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score))
  } catch {
    // The game still works when storage is disabled or unavailable.
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(loadHighScore)
  const [finalScore, setFinalScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [stage, setStage] = useState<StageInfo>(INITIAL_STAGE)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const game = new Game(canvas, {
      onScoreChange: (nextScore) => {
        setScore(nextScore)
        setHighScore((currentHighScore) =>
          Math.max(currentHighScore, nextScore),
        )
      },
      onPauseChange: setIsPaused,
      onStageChange: setStage,
      onGameOver: (endedScore) => {
        setFinalScore(endedScore)
        setIsGameOver(true)
        setHighScore((currentHighScore) => {
          const nextHighScore = Math.max(currentHighScore, endedScore)
          saveHighScore(nextHighScore)
          return nextHighScore
        })
      },
    })
    gameRef.current = game
    game.start()

    return () => {
      game.dispose()
      gameRef.current = null
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isGameOver) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [isGameOver])

  const resetGame = (): void => {
    setIsGameOver(false)
    setScore(0)
    setFinalScore(0)
    gameRef.current?.resetGame()
  }

  const stageProgress = Math.min(
    100,
    Math.max(
      0,
      ((score - stage.minScore) /
        (stage.targetScore - stage.minScore)) *
        100,
    ),
  )
  const hudStyle = {
    '--stage-color': stage.color,
  } as CSSProperties

  return (
    <>
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="score-hud" style={hudStyle} aria-live="polite">
        <div>
          SCORE <span>{score}</span>
        </div>
        <div className="high-score">
          HIGH SCORE <span>{highScore}</span>
        </div>
        <div className="stage-label">
          STAGE <strong>{stage.name}</strong>
        </div>
        <div className="stage-progress" aria-hidden="true">
          <span style={{ width: `${stageProgress}%` }} />
        </div>
        <small>META {stage.targetScore}</small>
      </div>
      <button
        type="button"
        className="pause-button"
        onClick={() => gameRef.current?.togglePause()}
        disabled={isGameOver}
      >
        {isPaused ? 'Reanudar' : 'Pausa'} <kbd>Esc</kbd>
      </button>
      <div className="controls-hint">
        A / D CAMBIAR CARRIL · ESPACIO SALTAR
      </div>
      <div
        className={`pause-overlay ${isPaused ? 'is-visible' : ''}`}
        aria-hidden={!isPaused}
      >
        <strong>PAUSA</strong>
        <span>Presiona Esc para continuar</span>
      </div>
      <dialog ref={dialogRef} className="game-over-dialog">
        <h1>Game Over</h1>
        <p>
          Chocaste con un obstáculo.
          <br />
          Puntuación final: <strong>{finalScore}</strong>
        </p>
        <button type="button" onClick={resetGame}>
          Intentar otra vez
        </button>
      </dialog>
    </>
  )
}

export default App
