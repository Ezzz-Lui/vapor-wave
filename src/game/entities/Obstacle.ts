import {
  Box3,
  BoxGeometry,
  ConeGeometry,
  Mesh,
  MeshStandardMaterial,
  type BufferGeometry,
} from 'three'
import {
  COLORS,
  OBSTACLE,
  laneIndexToX,
  randomLaneIndex,
} from '../config/gameConfig'

export type ObstacleKind = 'cube' | 'pyramid'

export class Obstacle {
  readonly mesh: Mesh

  private readonly geometry: BufferGeometry
  private readonly material: MeshStandardMaterial
  private readonly hitbox = new Box3()
  private readonly kind: ObstacleKind
  private readonly baseY: number
  private readonly phase = Math.random() * Math.PI * 2
  private elapsed = 0

  constructor(kind: ObstacleKind, laneIndex: number) {
    this.kind = kind
    const built = kind === 'cube' ? this.createCube() : this.createPyramid()
    this.geometry = built.geometry
    this.material = built.material
    this.mesh = new Mesh(this.geometry, this.material)

    const height =
      kind === 'cube' ? OBSTACLE.cubeSize : OBSTACLE.pyramidHeight
    this.baseY = height * 0.5

    this.mesh.position.set(
      laneIndexToX(laneIndex),
      this.baseY,
      OBSTACLE.spawnZ,
    )
  }

  update(delta: number, scrollSpeed: number): void {
    this.elapsed += delta
    this.mesh.position.z += scrollSpeed * delta
    this.mesh.position.y =
      this.baseY + Math.sin(this.elapsed * 3.4 + this.phase) * 0.07
    this.mesh.rotation.y +=
      delta * (this.kind === 'pyramid' ? 1.15 : 0.25)
    this.material.emissiveIntensity =
      1.45 + Math.sin(this.elapsed * 4 + this.phase) * 0.28
  }

  isPastCamera(): boolean {
    return this.mesh.position.z > OBSTACLE.despawnZ
  }

  getHitbox(): Box3 {
    this.hitbox.setFromObject(this.mesh)
    this.hitbox.expandByScalar(OBSTACLE.hitboxPadding)
    return this.hitbox
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }

  private createCube(): {
    geometry: BufferGeometry
    material: MeshStandardMaterial
  } {
    return {
      geometry: new BoxGeometry(
        OBSTACLE.cubeSize,
        OBSTACLE.cubeSize,
        OBSTACLE.cubeSize,
      ),
      material: new MeshStandardMaterial({
        color: COLORS.obstacleCube,
        emissive: COLORS.obstacleCubeEmissive,
        emissiveIntensity: 1.6,
        roughness: 0.3,
        metalness: 0.15,
      }),
    }
  }

  private createPyramid(): {
    geometry: BufferGeometry
    material: MeshStandardMaterial
  } {
    return {
      geometry: new ConeGeometry(
        OBSTACLE.pyramidRadius,
        OBSTACLE.pyramidHeight,
        4,
      ),
      material: new MeshStandardMaterial({
        color: COLORS.obstaclePyramid,
        emissive: COLORS.obstaclePyramidEmissive,
        emissiveIntensity: 1.5,
        roughness: 0.35,
        metalness: 0.1,
      }),
    }
  }

  static randomKind(): ObstacleKind {
    return Math.random() < 0.5 ? 'cube' : 'pyramid'
  }

  static randomLane(): number {
    return randomLaneIndex()
  }
}
