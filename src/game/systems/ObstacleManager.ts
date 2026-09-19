import { Box3, type Scene } from 'three'
import { Obstacle } from '../entities/Obstacle'

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

  update(delta: number, scrollSpeed: number, spawnInterval: number): void {
    this.spawnAccumulator += delta

    while (this.spawnAccumulator >= spawnInterval) {
      this.spawnAccumulator -= spawnInterval
      this.spawn()
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

  private spawn(): void {
    const obstacle = new Obstacle(
      Obstacle.randomKind(),
      Obstacle.randomLane(),
    )
    this.obstacles.push(obstacle)
    this.scene.add(obstacle.mesh)
  }

  private removeAt(index: number): void {
    const obstacle = this.obstacles[index]
    if (!obstacle) return

    this.scene.remove(obstacle.mesh)
    obstacle.dispose()
    this.obstacles.splice(index, 1)
  }
}
