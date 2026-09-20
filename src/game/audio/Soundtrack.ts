import soundtrackUrl from '../../assets/game-soundtrack.mp3'
import { AUDIO } from '../config/gameConfig'
import { loadMusicEnabled, saveMusicEnabled } from '../persistence/storage'

/**
 * Background loop owned by Game. Survives pause and game over; only
 * rewind happens on explicit retry or when the instance is disposed.
 */
export class Soundtrack {
  private readonly audio: HTMLAudioElement
  private enabled = loadMusicEnabled()
  private unlockArmed = false

  private readonly unlock = (): void => {
    this.unlockArmed = false
    this.removeUnlockListeners()
    void this.play()
  }

  constructor() {
    this.audio = new Audio(soundtrackUrl)
    this.audio.loop = true
    this.audio.preload = 'auto'
    this.audio.volume = AUDIO.volume
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    saveMusicEnabled(enabled)

    if (enabled) {
      this.play()
      return
    }

    this.removeUnlockListeners()
    this.audio.pause()
  }

  play(): void {
    if (!this.enabled) return

    const attempt = this.audio.play()
    if (!attempt) return

    void attempt.catch(() => {
      this.armUnlock()
    })
  }

  restart(): void {
    if (!this.enabled) {
      this.audio.pause()
      this.audio.currentTime = 0
      return
    }

    this.audio.currentTime = 0
    this.play()
  }

  dispose(): void {
    this.removeUnlockListeners()
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
  }

  private armUnlock(): void {
    if (this.unlockArmed || !this.enabled) return
    this.unlockArmed = true
    window.addEventListener('pointerdown', this.unlock)
    window.addEventListener('keydown', this.unlock)
  }

  private removeUnlockListeners(): void {
    window.removeEventListener('pointerdown', this.unlock)
    window.removeEventListener('keydown', this.unlock)
    this.unlockArmed = false
  }
}
