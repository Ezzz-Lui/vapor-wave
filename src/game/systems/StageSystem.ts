import type { ObstacleKind } from '../entities/Obstacle'

export type StageId = 'easy' | 'intermediate' | 'hard' | 'challenger'

export interface StagePalette {
  readonly primary: number
  readonly secondary: number
  readonly accent: number
  readonly background: number
  readonly fog: number
  readonly css: string
}

export interface StageDefinition {
  readonly id: StageId
  readonly name: string
  readonly minScore: number
  readonly targetScore: number
  readonly palette: StagePalette
  readonly obstacleKinds: readonly ObstacleKind[]
  readonly spawnCounts: readonly number[]
  readonly baseScrollSpeed: number
  readonly baseSpawnInterval: number
  readonly worldSpeedMultiplier: number
  readonly activeWorldPieces: number
  readonly afterimage: boolean
}

export interface StageInfo {
  readonly id: StageId
  readonly name: string
  readonly color: string
  readonly minScore: number
  readonly targetScore: number
}

export const STAGES: readonly StageDefinition[] = [
  {
    id: 'easy',
    name: 'Fácil',
    minScore: 0,
    targetScore: 500,
    palette: {
      primary: 0x00b7ff,
      secondary: 0x2455ff,
      accent: 0x73e7ff,
      background: 0x020819,
      fog: 0x082c62,
      css: '#00b7ff',
    },
    obstacleKinds: ['cube'],
    spawnCounts: [1],
    baseScrollSpeed: 18,
    baseSpawnInterval: 1.25,
    worldSpeedMultiplier: 0.85,
    activeWorldPieces: 10,
    afterimage: false,
  },
  {
    id: 'intermediate',
    name: 'Intermedio',
    minScore: 500,
    targetScore: 1000,
    palette: {
      primary: 0xff8a00,
      secondary: 0xff4d00,
      accent: 0xffcf66,
      background: 0x1a0700,
      fog: 0x5c1b00,
      css: '#ff8a00',
    },
    obstacleKinds: ['cube', 'pyramid'],
    spawnCounts: [1, 2, 2],
    baseScrollSpeed: 25,
    baseSpawnInterval: 0.95,
    worldSpeedMultiplier: 1,
    activeWorldPieces: 14,
    afterimage: false,
  },
  {
    id: 'hard',
    name: 'Difícil',
    minScore: 1000,
    targetScore: 1500,
    palette: {
      primary: 0xff1744,
      secondary: 0xb0002a,
      accent: 0xff6685,
      background: 0x170005,
      fog: 0x560014,
      css: '#ff1744',
    },
    obstacleKinds: ['cube', 'pyramid', 'spike'],
    spawnCounts: [1, 2, 2, 3],
    baseScrollSpeed: 33,
    baseSpawnInterval: 0.72,
    worldSpeedMultiplier: 1.18,
    activeWorldPieces: 18,
    afterimage: false,
  },
  {
    id: 'challenger',
    name: 'Challenger',
    minScore: 1500,
    targetScore: 2000,
    palette: {
      primary: 0xffef00,
      secondary: 0xffa800,
      accent: 0xffff9a,
      background: 0x160f00,
      fog: 0x594000,
      css: '#ffef00',
    },
    obstacleKinds: ['cube', 'pyramid', 'spike'],
    spawnCounts: [2, 2, 3, 3],
    baseScrollSpeed: 45,
    baseSpawnInterval: 0.48,
    worldSpeedMultiplier: 1.55,
    activeWorldPieces: 26,
    afterimage: true,
  },
] as const

export class StageSystem {
  private current = STAGES[0] as StageDefinition

  update(score: number): boolean {
    const next = this.findStage(score)
    if (next.id === this.current.id) return false

    this.current = next
    return true
  }

  getCurrent(): StageDefinition {
    return this.current
  }

  getInfo(): StageInfo {
    return {
      id: this.current.id,
      name: this.current.name,
      color: this.current.palette.css,
      minScore: this.current.minScore,
      targetScore: this.current.targetScore,
    }
  }

  reset(): void {
    this.current = STAGES[0] as StageDefinition
  }

  private findStage(score: number): StageDefinition {
    for (let index = STAGES.length - 1; index >= 0; index -= 1) {
      const stage = STAGES[index]
      if (stage && score >= stage.minScore) return stage
    }

    return STAGES[0] as StageDefinition
  }
}
