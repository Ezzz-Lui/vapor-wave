import {
  Box3,
  BoxGeometry,
  ConeGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  type BufferGeometry,
} from 'three'
import {
  COLORS,
  OBSTACLE,
  laneIndexToX,
} from '../config/gameConfig'

export type ObstacleKind = 'cube' | 'pyramid' | 'spike'

export class Obstacle {
  readonly root = new Group()

  private readonly geometries: BufferGeometry[] = []
  private readonly material: MeshStandardMaterial
  private readonly hitbox = new Box3()
  private readonly kind: ObstacleKind
  private readonly baseY: number
  private readonly phase = Math.random() * Math.PI * 2
  private elapsed = 0

  constructor(kind: ObstacleKind, laneIndex: number) {
    this.kind = kind
    this.material = this.createMaterial(kind)

    switch (kind) {
      case 'cube':
        this.createCube()
        break
      case 'pyramid':
        this.createPyramid()
        break
      case 'spike':
        this.createSpikeBall()
        break
    }

    const height = this.getHeight(kind)
    this.baseY = height * 0.5

    this.root.position.set(
      laneIndexToX(laneIndex),
      this.baseY,
      OBSTACLE.spawnZ,
    )
  }

  update(delta: number, scrollSpeed: number): void {
    this.elapsed += delta
    this.root.position.z += scrollSpeed * delta
    this.root.position.y =
      this.baseY + Math.sin(this.elapsed * 3.4 + this.phase) * 0.07
    this.root.rotation.y +=
      delta * (this.kind === 'pyramid' ? 1.15 : 0.25)
    if (this.kind === 'spike') {
      this.root.rotation.x += delta * 0.7
      this.root.rotation.z += delta * 0.45
    }
    this.material.emissiveIntensity =
      1.45 + Math.sin(this.elapsed * 4 + this.phase) * 0.28
  }

  isPastCamera(): boolean {
    return this.root.position.z > OBSTACLE.despawnZ
  }

  getHitbox(): Box3 {
    this.hitbox.setFromObject(this.root)
    this.hitbox.expandByScalar(OBSTACLE.hitboxPadding)
    return this.hitbox
  }

  dispose(): void {
    for (const geometry of this.geometries) {
      geometry.dispose()
    }
    this.material.dispose()
  }

  private createCube(): void {
    const geometry = new BoxGeometry(
      OBSTACLE.cubeSize,
      OBSTACLE.cubeSize,
      OBSTACLE.cubeSize,
    )
    this.geometries.push(geometry)
    this.root.add(new Mesh(geometry, this.material))
  }

  private createPyramid(): void {
    const geometry = new ConeGeometry(
      OBSTACLE.pyramidRadius,
      OBSTACLE.pyramidHeight,
      4,
    )
    this.geometries.push(geometry)
    this.root.add(new Mesh(geometry, this.material))
  }

  private createSpikeBall(): void {
    const coreGeometry = new IcosahedronGeometry(0.48, 1)
    const spikeGeometry = new ConeGeometry(0.13, 0.5, 6)
    const core = new Mesh(coreGeometry, this.material)
    const spikeDistance = 0.7

    const directions = [
      { position: [0, spikeDistance, 0], rotation: [0, 0, 0] },
      { position: [0, -spikeDistance, 0], rotation: [0, 0, Math.PI] },
      {
        position: [spikeDistance, 0, 0],
        rotation: [0, 0, -Math.PI / 2],
      },
      {
        position: [-spikeDistance, 0, 0],
        rotation: [0, 0, Math.PI / 2],
      },
      {
        position: [0, 0, spikeDistance],
        rotation: [Math.PI / 2, 0, 0],
      },
      {
        position: [0, 0, -spikeDistance],
        rotation: [-Math.PI / 2, 0, 0],
      },
    ] as const

    this.root.add(core)
    for (const direction of directions) {
      const spike = new Mesh(spikeGeometry, this.material)
      spike.position.set(
        direction.position[0],
        direction.position[1],
        direction.position[2],
      )
      spike.rotation.set(
        direction.rotation[0],
        direction.rotation[1],
        direction.rotation[2],
      )
      this.root.add(spike)
    }

    this.geometries.push(coreGeometry, spikeGeometry)
  }

  private createMaterial(kind: ObstacleKind): MeshStandardMaterial {
    const isCube = kind === 'cube'
    const isSpike = kind === 'spike'
    const color = isSpike
      ? 0xff2bd6
      : isCube
        ? COLORS.obstacleCube
        : COLORS.obstaclePyramid
    const emissive = isSpike
      ? 0xff006e
      : isCube
        ? COLORS.obstacleCubeEmissive
        : COLORS.obstaclePyramidEmissive

    return new MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 1.55,
      roughness: 0.3,
      metalness: 0.15,
    })
  }

  private getHeight(kind: ObstacleKind): number {
    switch (kind) {
      case 'cube':
        return OBSTACLE.cubeSize
      case 'pyramid':
        return OBSTACLE.pyramidHeight
      case 'spike':
        return 1.4
    }
  }

  static randomKind(
    allowedKinds: readonly ObstacleKind[],
  ): ObstacleKind {
    const index = Math.floor(Math.random() * allowedKinds.length)
    return allowedKinds[index] ?? 'cube'
  }
}
