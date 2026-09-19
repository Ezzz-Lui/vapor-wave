import { useEffect, useRef, useState } from 'react'
import { Game } from './game/core/Game'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [score, setScore] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const game = new Game(canvas, {
      onScoreChange: setScore,
      onGameOver: (endedScore) => {
        setFinalScore(endedScore)
        setIsGameOver(true)
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

  return (
    <>
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="score-hud" aria-live="polite">
        SCORE <span>{score}</span>
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
