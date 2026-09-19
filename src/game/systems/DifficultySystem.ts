import { DIFFICULTY, GRID, OBSTACLE } from '../config/gameConfig'

/**
 * Mutable run-time difficulty. Reset restores base speeds from config.
 */
export class DifficultySystem {
  private scrollSpeed: number = GRID.scrollSpeed
  private spawnInterval: number = OBSTACLE.spawnInterval
  private stepAccumulator = 0

  update(delta: number): void {
    this.stepAccumulator += delta

    while (this.stepAccumulator >= DIFFICULTY.stepInterval) {
      this.stepAccumulator -= DIFFICULTY.stepInterval
      this.applyStep()
    }
  }

  getScrollSpeed(): number {
    return this.scrollSpeed
  }

  getSpawnInterval(): number {
    return this.spawnInterval
  }

  reset(): void {
    this.scrollSpeed = GRID.scrollSpeed
    this.spawnInterval = OBSTACLE.spawnInterval
    this.stepAccumulator = 0
  }

  private applyStep(): void {
    this.scrollSpeed = Math.min(
      DIFFICULTY.maxScrollSpeed,
      this.scrollSpeed * DIFFICULTY.scrollMultiplier,
    )
    this.spawnInterval = Math.max(
      DIFFICULTY.minSpawnInterval,
      this.spawnInterval * DIFFICULTY.spawnIntervalMultiplier,
    )
  }
}
