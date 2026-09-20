import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Game } from './game/core/Game'
import {
  loadHighScore,
  loadMusicEnabled,
  saveHighScore,
} from './game/persistence/storage'
import type { StageInfo } from './game/systems/StageSystem'
import { HomeScreen } from './ui/HomeScreen'

const INITIAL_STAGE: StageInfo = {
  id: 'easy',
  name: 'Fácil',
  color: '#00b7ff',
  minScore: 0,
  targetScore: 500,
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
  const [isHome, setIsHome] = useState(true)
  const [musicEnabled, setMusicEnabled] = useState(loadMusicEnabled)
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

  const startGame = (): void => {
    setIsHome(false)
    setIsGameOver(false)
    setScore(0)
    setFinalScore(0)
    gameRef.current?.startRun()
  }

  const resetGame = (): void => {
    setIsGameOver(false)
    setScore(0)
    setFinalScore(0)
    gameRef.current?.resetGame()
  }

  const toggleMusic = (): void => {
    const nextEnabled = !musicEnabled
    setMusicEnabled(nextEnabled)
    gameRef.current?.setMusicEnabled(nextEnabled)
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
      {isHome ? (
        <HomeScreen
          highScore={highScore}
          musicEnabled={musicEnabled}
          onToggleMusic={toggleMusic}
          onStart={startGame}
        />
      ) : (
        <>
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
        </>
      )}
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
