import { DIFFICULTY } from '../config/gameConfig'
import type { StageDefinition } from './StageSystem'

/**
 * Mutable run-time difficulty. Reset restores base speeds from config.
 */
export class DifficultySystem {
  private scrollSpeed = 0
  private spawnInterval = 0
  private stageId = ''
  private stepAccumulator = 0

  update(delta: number, stage: StageDefinition): void {
    if (stage.id !== this.stageId) {
      this.applyStage(stage)
    }

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

  reset(stage: StageDefinition): void {
    this.stageId = ''
    this.scrollSpeed = 0
    this.spawnInterval = 0
    this.stepAccumulator = 0
    this.applyStage(stage)
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

  private applyStage(stage: StageDefinition): void {
    this.stageId = stage.id
    this.scrollSpeed = Math.max(
      this.scrollSpeed,
      stage.baseScrollSpeed,
    )
    this.spawnInterval =
      this.spawnInterval === 0
        ? stage.baseSpawnInterval
        : Math.min(this.spawnInterval, stage.baseSpawnInterval)
    this.stepAccumulator = 0
  }
}
