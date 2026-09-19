import {
  BoxGeometry,
  BufferGeometry,
  Group,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  TetrahedronGeometry,
  TorusGeometry,
} from 'three'
import {
  COLORS,
  WORLD,
  getRoadHalfWidth,
} from '../config/gameConfig'

type Side = -1 | 1

interface WorldPiece {
  readonly mesh: Mesh
  readonly side: Side
  readonly spinX: number
  readonly spinY: number
  readonly phase: number
  baseY: number
}

/**
 * Animated wireframe scenery outside the road. It is decorative only and
 * recycles objects instead of allocating geometry during the game loop.
 */
export class GeometricWorld {
  readonly group = new Group()

  private readonly pieces: WorldPiece[] = []
  private readonly geometries: BufferGeometry[] = []
  private readonly materials: MeshBasicMaterial[] = []
  private readonly horizon = new Group()
  private elapsed = 0

  constructor() {
    this.createHorizon()
    this.createSideWorld()
  }

  update(delta: number, scrollSpeed: number): void {
    this.elapsed += delta
    this.horizon.rotation.z += delta * 0.035

    for (const piece of this.pieces) {
      piece.mesh.position.z += scrollSpeed * WORLD.scrollRatio * delta
      piece.mesh.rotation.x += piece.spinX * delta
      piece.mesh.rotation.y += piece.spinY * delta
      piece.mesh.position.y =
        piece.baseY + Math.sin(this.elapsed * 1.2 + piece.phase) * 0.16

      if (piece.mesh.position.z > WORLD.nearZ) {
        this.placePiece(piece, true)
      }
    }
  }

  reset(): void {
    this.elapsed = 0
    this.horizon.rotation.z = 0

    this.pieces.forEach((piece, index) => {
      this.placePiece(piece, false, index)
    })
  }

  dispose(): void {
    for (const geometry of this.geometries) {
      geometry.dispose()
    }
    for (const material of this.materials) {
      material.dispose()
    }
  }

  private createHorizon(): void {
    const colors = [
      COLORS.worldMagenta,
      COLORS.worldViolet,
      COLORS.worldCyan,
    ]

    colors.forEach((color, index) => {
      const geometry = new TorusGeometry(2.2 + index * 1.3, 0.035, 8, 80)
      const material = this.createMaterial(color, 0.72 - index * 0.12)
      const ring = new Mesh(geometry, material)
      ring.rotation.z = index * 0.35

      this.geometries.push(geometry)
      this.horizon.add(ring)
    })

    this.horizon.position.set(0, 6.5, -44)
    this.group.add(this.horizon)
  }

  private createSideWorld(): void {
    for (let index = 0; index < WORLD.objectCount; index += 1) {
      const side: Side = index % 2 === 0 ? -1 : 1
      const geometry = this.createRandomGeometry()
      const color =
        index % 3 === 0
          ? COLORS.worldCyan
          : index % 3 === 1
            ? COLORS.worldMagenta
            : COLORS.worldViolet
      const material = this.createMaterial(color, 0.72)
      const mesh = new Mesh(geometry, material)
      const scale = this.random(WORLD.minScale, WORLD.maxScale)
      mesh.scale.setScalar(scale)

      const piece: WorldPiece = {
        mesh,
        side,
        spinX: this.random(-0.32, 0.32),
        spinY: this.random(-0.45, 0.45),
        phase: Math.random() * Math.PI * 2,
        baseY: 0,
      }

      this.geometries.push(geometry)
      this.pieces.push(piece)
      this.placePiece(piece, false, index)
      this.group.add(mesh)
    }
  }

  private placePiece(
    piece: WorldPiece,
    atFarEdge: boolean,
    index = 0,
  ): void {
    const roadHalfWidth = getRoadHalfWidth()
    const sideDistance = this.random(
      WORLD.minSideOffset,
      WORLD.maxSideOffset,
    )
    const distributedZ = MathUtils.lerp(
      WORLD.farZ,
      WORLD.nearZ,
      index / Math.max(1, WORLD.objectCount - 1),
    )

    piece.baseY = this.random(WORLD.minHeight, WORLD.maxHeight)
    piece.mesh.position.set(
      piece.side * (roadHalfWidth + sideDistance),
      piece.baseY,
      atFarEdge ? WORLD.farZ - Math.random() * 8 : distributedZ,
    )
  }

  private createRandomGeometry(): BufferGeometry {
    const choice = Math.floor(Math.random() * 4)

    switch (choice) {
      case 0:
        return new IcosahedronGeometry(1, 0)
      case 1:
        return new OctahedronGeometry(1)
      case 2:
        return new TetrahedronGeometry(1)
      default:
        return new BoxGeometry(1.4, 1.4, 1.4)
    }
  }

  private createMaterial(color: number, opacity: number): MeshBasicMaterial {
    const material = new MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity,
      toneMapped: false,
    })
    this.materials.push(material)
    return material
  }

  private random(min: number, max: number): number {
    return MathUtils.lerp(min, max, Math.random())
  }
}
