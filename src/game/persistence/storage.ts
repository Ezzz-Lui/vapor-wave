import { STORAGE_KEYS } from '../config/gameConfig'

export function loadHighScore(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEYS.highScore))
    return Number.isFinite(stored) && stored > 0 ? stored : 0
  } catch {
    return 0
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.highScore, String(score))
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export function loadMusicEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.musicEnabled)
    if (stored === null) return true
    return stored === 'true'
  } catch {
    return true
  }
}

export function saveMusicEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.musicEnabled, String(enabled))
  } catch {
    // Storage can be unavailable in private mode.
  }
}
