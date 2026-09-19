export const COLORS = {
  background: 0x0a0014,
  fog: 0x2a0038,
  gridPrimary: 0xff00aa,
  gridSecondary: 0x00ffcc,
  playerBody: 0xff66cc,
  playerEmissive: 0xff1493,
  playerEye: 0x09000f,
  ambientLight: 0xff88dd,
  directionalLight: 0xffffff,
  obstacleCube: 0xff2244,
  obstacleCubeEmissive: 0xff0033,
  obstaclePyramid: 0xffcc00,
  obstaclePyramidEmissive: 0xff9900,
  worldCyan: 0x00ffcc,
  worldMagenta: 0xff00aa,
  worldViolet: 0x8a2be2,
} as const

/** Three discrete lanes: left (0), center (1), right (2). */
export const LANES = {
  count: 3,
  /** World X offset between adjacent lanes. */
  spacing: 2.6,
  /** Lerp speed when switching lanes. */
  switchSpeed: 14,
  /** Additional space between the outer lane centers and road edges. */
  edgePadding: 1.3,
} as const

export const PLAYER = {
  radius: 0.55,
  y: 0.55,
  z: 2,
  /** Starting lane index (center). */
  startLane: 1,
  eyeRadius: 0.085,
  eyeOffsetX: 0.18,
  eyeOffsetY: 0.12,
  eyeOffsetZ: 0.545,
  blinkDuration: 0.13,
  blinkIntervalMin: 2,
  blinkIntervalMax: 4.5,
  jumpVelocity: 8.8,
  gravity: 22,
  /** Shrink AABB vs visual mesh so corner grazes feel fair. */
  hitboxScale: 0.78,
} as const

export const GRID = {
  size: 40,
  crossLineSpacing: 1,
  scrollSpeed: 18,
} as const

export const WORLD = {
  objectCount: 26,
  nearZ: 12,
  farZ: -62,
  minSideOffset: 2.5,
  maxSideOffset: 10,
  minHeight: 0.8,
  maxHeight: 5.5,
  minScale: 0.65,
  maxScale: 2.2,
  scrollRatio: 0.52,
} as const

export const POST_PROCESSING = {
  bloomStrength: 0.5,
  bloomRadius: 0.25,
  bloomThreshold: 0.12,
  exposure: 1.05,
} as const

export const OBSTACLE = {
  spawnInterval: 1.15,
  spawnZ: -48,
  despawnZ: 14,
  scrollSpeed: 18,
  cubeSize: 1.1,
  pyramidRadius: 0.75,
  pyramidHeight: 1.4,
  /** Slight shrink so AABB is not harsher than the neon silhouette. */
  hitboxPadding: -0.08,
} as const

export const SCORE = {
  /** Award 1 point every N seconds of survival (100ms). */
  tickInterval: 0.1,
  pointsPerTick: 1,
} as const

export const DIFFICULTY = {
  /** Scale world speed every N seconds of survival. */
  stepInterval: 10,
  scrollMultiplier: 1.025,
  spawnIntervalMultiplier: 0.97,
  maxScrollSpeed: 60,
  minSpawnInterval: 0.3,
} as const

export const CAMERA = {
  fov: 60,
  near: 0.1,
  far: 120,
  offsetX: 0,
  offsetY: 4.5,
  offsetZ: 9,
  lookAtY: 0.5,
  lookAtZ: -12,
} as const

export const FOG = {
  near: 18,
  far: 55,
} as const

export const RENDERER = {
  maxPixelRatio: 2,
} as const

export const LOOP = {
  maxDelta: 0.05,
} as const

export function laneIndexToX(laneIndex: number): number {
  const center = (LANES.count - 1) / 2
  return (laneIndex - center) * LANES.spacing
}

export function getRoadHalfWidth(): number {
  return (
    laneIndexToX(LANES.count - 1) +
    LANES.edgePadding
  )
}

export function randomLaneIndex(): number {
  return Math.floor(Math.random() * LANES.count)
}
