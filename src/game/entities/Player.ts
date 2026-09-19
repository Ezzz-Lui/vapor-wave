import {
  Box3,
  CircleGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three'
import {
  COLORS,
  LANES,
  PLAYER,
  laneIndexToX,
} from '../config/gameConfig'

export class Player {
  readonly group = new Group()

  private readonly visual = new Group()
  private readonly body: Mesh
  private readonly eyes: Mesh[] = []
  private readonly geometries: BufferGeometry[] = []
  private readonly materials: Material[] = []
  private readonly hitbox = new Box3()
  private readonly hitboxCenter = new Vector3()
  private readonly hitboxSize = new Vector3()
  private laneIndex: number = PLAYER.startLane
  private blinkCountdown = this.randomBlinkInterval()
  private blinkElapsed = 0
  private blinking = false
  private elapsed = 0
  private laneLean = 0

  constructor() {
    this.body = this.createBody()
    this.visual.add(this.body)
    this.visual.add(this.createEye(-PLAYER.eyeOffsetX))
    this.visual.add(this.createEye(PLAYER.eyeOffsetX))
    this.group.add(this.visual)

    this.group.position.set(laneIndexToX(this.laneIndex), PLAYER.y, PLAYER.z)
  }

  /**
   * @param laneDelta -1 / 0 / 1 from a single key press edge
   */
  update(delta: number, laneDelta: number): void {
    this.elapsed += delta

    if (laneDelta !== 0) {
      this.laneIndex = MathUtils.clamp(
        this.laneIndex + laneDelta,
        0,
        LANES.count - 1,
      )
      this.laneLean = -laneDelta * 0.32
    }

    const targetX = laneIndexToX(this.laneIndex)
    this.group.position.x = MathUtils.damp(
      this.group.position.x,
      targetX,
      LANES.switchSpeed,
      delta,
    )
    this.laneLean = MathUtils.damp(this.laneLean, 0, 8, delta)
    this.visual.rotation.z = this.laneLean
    this.visual.position.y = Math.sin(this.elapsed * 5) * 0.025
    this.updateBlink(delta)
  }

  reset(): void {
    this.laneIndex = PLAYER.startLane
    this.group.position.set(laneIndexToX(this.laneIndex), PLAYER.y, PLAYER.z)
    this.visual.position.y = 0
    this.visual.rotation.z = 0
    this.laneLean = 0
    this.elapsed = 0
    this.blinking = false
    this.blinkElapsed = 0
    this.blinkCountdown = this.randomBlinkInterval()
    this.setEyeScale(1)
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

  private createEye(offsetX: number): Mesh {
    const geometry = new CircleGeometry(PLAYER.eyeRadius, 20)
    const material = new MeshBasicMaterial({
      color: COLORS.playerEye,
      toneMapped: false,
    })
    const eye = new Mesh(geometry, material)
    eye.position.set(offsetX, PLAYER.eyeOffsetY, PLAYER.eyeOffsetZ)

    this.geometries.push(geometry)
    this.materials.push(material)
    this.eyes.push(eye)

    return eye
  }

  private updateBlink(delta: number): void {
    if (!this.blinking) {
      this.blinkCountdown -= delta
      if (this.blinkCountdown <= 0) {
        this.blinking = true
        this.blinkElapsed = 0
      }
      return
    }

    this.blinkElapsed += delta
    const progress = Math.min(
      1,
      this.blinkElapsed / PLAYER.blinkDuration,
    )
    const closingProgress =
      progress < 0.5 ? progress * 2 : (1 - progress) * 2
    this.setEyeScale(MathUtils.lerp(1, 0.12, closingProgress))

    if (progress >= 1) {
      this.blinking = false
      this.blinkCountdown = this.randomBlinkInterval()
      this.setEyeScale(1)
    }
  }

  private setEyeScale(scaleY: number): void {
    for (const eye of this.eyes) {
      eye.scale.set(1.08, scaleY, 1)
    }
  }

  private randomBlinkInterval(): number {
    return MathUtils.lerp(
      PLAYER.blinkIntervalMin,
      PLAYER.blinkIntervalMax,
      Math.random(),
    )
  }
}
