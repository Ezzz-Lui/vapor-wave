import {
  Box3,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import {
  COLORS,
  LANES,
  PLAYER,
  laneIndexToX,
} from '../config/gameConfig'

export class Player {
  readonly group = new Group()

  private readonly body: Mesh
  private readonly geometries: SphereGeometry[] = []
  private readonly materials: MeshStandardMaterial[] = []
  private readonly hitbox = new Box3()
  private readonly hitboxCenter = new Vector3()
  private readonly hitboxSize = new Vector3()
  private laneIndex: number = PLAYER.startLane

  constructor() {
    this.body = this.createBody()
    this.group.add(this.body)
    this.group.add(this.createEye(-PLAYER.eyeOffsetX))
    this.group.add(this.createEye(PLAYER.eyeOffsetX))

    this.group.position.set(laneIndexToX(this.laneIndex), PLAYER.y, PLAYER.z)
  }

  /**
   * @param laneDelta -1 / 0 / 1 from a single key press edge
   */
  update(delta: number, laneDelta: number): void {
    if (laneDelta !== 0) {
      this.laneIndex = MathUtils.clamp(
        this.laneIndex + laneDelta,
        0,
        LANES.count - 1,
      )
    }

    const targetX = laneIndexToX(this.laneIndex)
    this.group.position.x = MathUtils.damp(
      this.group.position.x,
      targetX,
      LANES.switchSpeed,
      delta,
    )
  }

  reset(): void {
    this.laneIndex = PLAYER.startLane
    this.group.position.set(laneIndexToX(this.laneIndex), PLAYER.y, PLAYER.z)
  }

  /**
   * AABB from the body mesh only (eyes ignored), then scaled down so
   * grazing the neon silhouette does not instantly trigger game over.
   */
  getHitbox(): Box3 {
    this.hitbox.setFromObject(this.body)
    this.hitbox.getCenter(this.hitboxCenter)
    this.hitbox.getSize(this.hitboxSize)
    this.hitboxSize.multiplyScalar(PLAYER.hitboxScale)
    this.hitbox.setFromCenterAndSize(this.hitboxCenter, this.hitboxSize)
    return this.hitbox
  }

  dispose(): void {
    for (const geometry of this.geometries) {
      geometry.dispose()
    }
    for (const material of this.materials) {
      material.dispose()
    }
  }

  private createBody(): Mesh {
    const geometry = new SphereGeometry(PLAYER.radius, 32, 32)
    const material = new MeshStandardMaterial({
      color: COLORS.playerBody,
      emissive: COLORS.playerEmissive,
      emissiveIntensity: 1.4,
      roughness: 0.35,
      metalness: 0.2,
    })

    this.geometries.push(geometry)
    this.materials.push(material)

    return new Mesh(geometry, material)
  }

  private createEye(offsetX: number): Group {
    const eyeGroup = new Group()

    const whiteGeometry = new SphereGeometry(PLAYER.eyeRadius, 16, 16)
    const whiteMaterial = new MeshStandardMaterial({
      color: COLORS.eyeWhite,
      emissive: COLORS.eyeWhite,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    })
    const white = new Mesh(whiteGeometry, whiteMaterial)
    this.geometries.push(whiteGeometry)
    this.materials.push(whiteMaterial)

    const pupilGeometry = new SphereGeometry(PLAYER.pupilRadius, 12, 12)
    const pupilMaterial = new MeshStandardMaterial({
      color: COLORS.pupil,
      roughness: 0.6,
    })
    const pupil = new Mesh(pupilGeometry, pupilMaterial)
    pupil.position.z = PLAYER.eyeRadius * 0.65
    this.geometries.push(pupilGeometry)
    this.materials.push(pupilMaterial)

    eyeGroup.add(white, pupil)
    eyeGroup.position.set(offsetX, PLAYER.eyeOffsetY, PLAYER.eyeOffsetZ)

    return eyeGroup
  }
}
