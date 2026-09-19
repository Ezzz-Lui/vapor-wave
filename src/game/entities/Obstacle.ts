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

  constructor(kind: ObstacleKind, laneIndex: number) {
    const built = kind === 'cube' ? this.createCube() : this.createPyramid()
    this.geometry = built.geometry
    this.material = built.material
    this.mesh = new Mesh(this.geometry, this.material)

    const height =
      kind === 'cube' ? OBSTACLE.cubeSize : OBSTACLE.pyramidHeight

    this.mesh.position.set(
      laneIndexToX(laneIndex),
      height * 0.5,
      OBSTACLE.spawnZ,
    )
  }

  update(delta: number, scrollSpeed: number): void {
    this.mesh.position.z += scrollSpeed * delta
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
