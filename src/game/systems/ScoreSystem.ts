import { SCORE } from '../config/gameConfig'

/**
 * Survival score: +1 every 100ms while the run is alive.
 */
export class ScoreSystem {
  private score = 0
  private accumulator = 0

  update(delta: number): void {
    this.accumulator += delta

    while (this.accumulator >= SCORE.tickInterval) {
      this.accumulator -= SCORE.tickInterval
      this.score += SCORE.pointsPerTick
    }
  }

  getScore(): number {
    return this.score
  }

  reset(): void {
    this.score = 0
    this.accumulator = 0
  }
}
