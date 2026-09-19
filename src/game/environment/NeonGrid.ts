import { GridHelper, Group } from 'three'
import { COLORS, GRID } from '../config/gameConfig'

/**
 * Two consecutive GridHelpers that scroll toward the camera and wrap,
 * creating an endless neon floor without allocating new geometry each frame.
 */
export class NeonGrid {
  readonly group = new Group()

  private readonly segments: GridHelper[]
  private readonly segmentLength: number

  constructor() {
    this.segmentLength = GRID.size

    const front = this.createSegment()
    const back = this.createSegment()

    front.position.z = 0
    back.position.z = -this.segmentLength

    this.segments = [front, back]
    this.group.add(front, back)
  }

  update(delta: number, scrollSpeed: number): void {
    const travel = scrollSpeed * delta

    for (const segment of this.segments) {
      segment.position.z += travel

      if (segment.position.z >= this.segmentLength) {
        const farthestZ = Math.min(
          ...this.segments.map((other) => other.position.z),
        )
        segment.position.z = farthestZ - this.segmentLength
      }
    }
  }

  dispose(): void {
    for (const segment of this.segments) {
      segment.geometry.dispose()
      const material = segment.material
      if (Array.isArray(material)) {
        for (const entry of material) {
          entry.dispose()
        }
      } else {
        material.dispose()
      }
    }
  }

  private createSegment(): GridHelper {
    const helper = new GridHelper(
      GRID.size,
      GRID.divisions,
      COLORS.gridPrimary,
      COLORS.gridSecondary,
    )
    helper.position.y = 0.01
    return helper
  }
}
