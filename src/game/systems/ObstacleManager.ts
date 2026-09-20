import { Box3, type Scene } from 'three'
import { LANES } from '../config/gameConfig'
import { Obstacle } from '../entities/Obstacle'
import type { StageDefinition } from './StageSystem'

/**
 * Owns obstacle spawn cadence, world scroll, GPU cleanup, and collision checks.
 * Speeds come from DifficultySystem each frame so scaling stays centralized.
 */
export class ObstacleManager {
  private readonly scene: Scene
  private readonly obstacles: Obstacle[] = []
  private spawnAccumulator = 0

  constructor(scene: Scene) {
    this.scene = scene
  }

  update(
    delta: number,
    scrollSpeed: number,
    spawnInterval: number,
    stage: StageDefinition,
  ): void {
    this.spawnAccumulator += delta

    while (this.spawnAccumulator >= spawnInterval) {
      this.spawnAccumulator -= spawnInterval
      this.spawnRow(stage)
    }

    for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
      const obstacle = this.obstacles[i]
      if (!obstacle) continue

      obstacle.update(delta, scrollSpeed)

      if (obstacle.isPastCamera()) {
        this.removeAt(i)
      }
    }
  }

  /** Returns true when any obstacle AABB intersects the player hitbox. */
  checkCollisions(playerHitbox: Box3): boolean {
    for (const obstacle of this.obstacles) {
      if (playerHitbox.intersectsBox(obstacle.getHitbox())) {
        return true
      }
    }
    return false
  }

  clear(): void {
    for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
      this.removeAt(i)
    }
    this.spawnAccumulator = 0
  }

  dispose(): void {
    this.clear()
  }

  private spawnRow(stage: StageDefinition): void {
    const spawnCount =
      stage.spawnCounts[
        Math.floor(Math.random() * stage.spawnCounts.length)
      ] ?? 1
    const lanes = Array.from(
      { length: LANES.count },
      (_, index) => index,
    )

    for (let index = lanes.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      const current = lanes[index]
      lanes[index] = lanes[swapIndex] ?? 0
      lanes[swapIndex] = current ?? 0
    }

    for (const laneIndex of lanes.slice(0, spawnCount)) {
      const obstacle = new Obstacle(
        Obstacle.randomKind(stage.obstacleKinds),
        laneIndex,
      )
      this.obstacles.push(obstacle)
      this.scene.add(obstacle.root)
    }
  }

  private removeAt(index: number): void {
    const obstacle = this.obstacles[index]
    if (!obstacle) return

    this.scene.remove(obstacle.root)
    obstacle.dispose()
    this.obstacles.splice(index, 1)
  }
}
