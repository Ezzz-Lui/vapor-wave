/**
 * Edge-triggered left/right for discrete lane switches (A/D or arrows).
 */
export class KeyboardInput {
  private leftHeld = false
  private rightHeld = false
  private leftJustPressed = false
  private rightJustPressed = false

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.setKey(event.code, true)
  }
  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.setKey(event.code, false)
  }

  connect(): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  disconnect(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.reset()
  }

  reset(): void {
    this.leftHeld = false
    this.rightHeld = false
    this.leftJustPressed = false
    this.rightJustPressed = false
  }

  /**
   * Returns -1 / 0 / 1 once per press. Holding a key does not repeat.
   * Consumes the edge so it is only read once per tick.
   */
  consumeLaneDelta(): number {
    let delta = 0
    if (this.leftJustPressed) delta -= 1
    if (this.rightJustPressed) delta += 1
    this.leftJustPressed = false
    this.rightJustPressed = false
    return delta
  }

  private setKey(code: string, pressed: boolean): void {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        if (pressed && !this.leftHeld) this.leftJustPressed = true
        this.leftHeld = pressed
        break
      case 'ArrowRight':
      case 'KeyD':
        if (pressed && !this.rightHeld) this.rightJustPressed = true
        this.rightHeld = pressed
        break
      default:
        break
    }
  }
}
