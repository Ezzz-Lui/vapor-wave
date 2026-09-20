/**
 * Edge-triggered left/right for discrete lane switches (A/D or arrows).
 */
export class KeyboardInput {
  private leftHeld = false
  private rightHeld = false
  private jumpHeld = false
  private leftJustPressed = false
  private rightJustPressed = false
  private jumpJustPressed = false
  private pauseHandler?: () => void

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Escape') {
      if (!event.repeat) this.pauseHandler?.()
      return
    }

    if (
      event.code === 'Space' ||
      event.code === 'ArrowLeft' ||
      event.code === 'ArrowRight'
    ) {
      event.preventDefault()
    }
    this.setKey(event.code, true)
  }
  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.setKey(event.code, false)
  }

  connect(): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  setPauseHandler(handler: () => void): void {
    this.pauseHandler = handler
  }

  disconnect(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.reset()
  }

  reset(): void {
    this.leftHeld = false
    this.rightHeld = false
    this.jumpHeld = false
    this.leftJustPressed = false
    this.rightJustPressed = false
    this.jumpJustPressed = false
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

  consumeJump(): boolean {
    const requested = this.jumpJustPressed
    this.jumpJustPressed = false
    return requested
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
      case 'Space':
        if (pressed && !this.jumpHeld) this.jumpJustPressed = true
        this.jumpHeld = pressed
        break
      default:
        break
    }
  }
}
