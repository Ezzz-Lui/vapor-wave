import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
} from 'three'
import {
  COLORS,
  GRID,
  LANES,
  getRoadHalfWidth,
} from '../config/gameConfig'

/**
 * Three-lane road built from explicit line segments. Unlike GridHelper, no
 * grid is rendered outside the playable width.
 */
export class NeonGrid {
  readonly group = new Group()

  private readonly segments: Group[]
  private readonly geometries: BufferGeometry[] = []
  private readonly materials: LineBasicMaterial[] = []
  private readonly primaryMaterials: LineBasicMaterial[] = []
  private readonly secondaryMaterials: LineBasicMaterial[] = []
  private readonly targetPrimary = new Color(COLORS.gridPrimary)
  private readonly targetSecondary = new Color(COLORS.gridSecondary)
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
    const colorBlend = 1 - Math.exp(-delta * 4)

    for (const material of this.primaryMaterials) {
      material.color.lerp(this.targetPrimary, colorBlend)
    }
    for (const material of this.secondaryMaterials) {
      material.color.lerp(this.targetSecondary, colorBlend)
    }

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

  setPalette(
    primary: number,
    secondary: number,
    immediate = false,
  ): void {
    this.targetPrimary.set(primary)
    this.targetSecondary.set(secondary)

    if (!immediate) return

    for (const material of this.primaryMaterials) {
      material.color.copy(this.targetPrimary)
    }
    for (const material of this.secondaryMaterials) {
      material.color.copy(this.targetSecondary)
    }
  }

  dispose(): void {
    for (const geometry of this.geometries) {
      geometry.dispose()
    }
    for (const material of this.materials) {
      material.dispose()
    }
  }

  private createSegment(): Group {
    const segment = new Group()
    const roadHalfWidth = getRoadHalfWidth()
    const laneVertices: number[] = []
    const edgeVertices: number[] = []
    const crossVertices: number[] = []

    for (let boundary = 0; boundary <= LANES.count; boundary += 1) {
      const x = -roadHalfWidth + boundary * LANES.spacing
      const target =
        boundary === 0 || boundary === LANES.count
          ? edgeVertices
          : laneVertices
      target.push(x, 0.025, -GRID.size / 2, x, 0.025, GRID.size / 2)
    }

    for (
      let z = -GRID.size / 2;
      z <= GRID.size / 2;
      z += GRID.crossLineSpacing
    ) {
      crossVertices.push(-roadHalfWidth, 0.02, z, roadHalfWidth, 0.02, z)
    }

    segment.add(
      this.createLines(edgeVertices, COLORS.gridPrimary, 1, true),
      this.createLines(laneVertices, COLORS.gridSecondary, 0.9, false),
      this.createLines(crossVertices, COLORS.gridPrimary, 0.42, true),
    )

    return segment
  }

  private createLines(
    vertices: number[],
    color: number,
    opacity: number,
    primary: boolean,
  ): LineSegments {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))

    const material = new LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      toneMapped: false,
    })

    this.geometries.push(geometry)
    this.materials.push(material)
    if (primary) {
      this.primaryMaterials.push(material)
    } else {
      this.secondaryMaterials.push(material)
    }

    return new LineSegments(geometry, material)
  }
}
