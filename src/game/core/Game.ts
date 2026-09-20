import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from 'three'
import {
  CAMERA,
  COLORS,
  FOG,
  HOME,
  LOOP,
  POST_PROCESSING,
  RENDERER,
} from '../config/gameConfig'
import { Player } from '../entities/Player'
import { GeometricWorld } from '../environment/GeometricWorld'
import { NeonGrid } from '../environment/NeonGrid'
import { PostProcessing } from '../graphics/PostProcessing'
import { Soundtrack } from '../audio/Soundtrack'
import { KeyboardInput } from '../input/KeyboardInput'
import { DifficultySystem } from '../systems/DifficultySystem'
import { ObstacleManager } from '../systems/ObstacleManager'
import { ScoreSystem } from '../systems/ScoreSystem'
import {
  StageSystem,
  type StageInfo,
} from '../systems/StageSystem'

export type GameOverHandler = (finalScore: number) => void
export type ScoreChangeHandler = (score: number) => void
export type PauseChangeHandler = (paused: boolean) => void
export type StageChangeHandler = (stage: StageInfo) => void

export class Game {
  private readonly scene: Scene
  private readonly camera: PerspectiveCamera
  private readonly renderer: WebGLRenderer
  private readonly postProcessing: PostProcessing
  private readonly timer = new Timer()
  private readonly soundtrack = new Soundtrack()
  private readonly input = new KeyboardInput()
  private readonly backgroundColor = new Color(COLORS.background)
  private readonly targetBackground = new Color(COLORS.background)
  private readonly fog = new Fog(COLORS.fog, FOG.near, FOG.far)
  private readonly targetFog = new Color(COLORS.fog)
  private readonly player: Player
  private readonly neonGrid: NeonGrid
  private readonly geometricWorld: GeometricWorld
  private readonly obstacles: ObstacleManager
  private readonly score = new ScoreSystem()
  private readonly difficulty = new DifficultySystem()
  private readonly stages = new StageSystem()
  private readonly onGameOver?: GameOverHandler
  private readonly onScoreChange?: ScoreChangeHandler
  private readonly onPauseChange?: PauseChangeHandler
  private readonly onStageChange?: StageChangeHandler
  private readonly onResize = (): void => {
    this.handleResize()
  }

  private running = false
  private gameOver = false
  private paused = false
  private preview = true
  private previewElapsed = 0
  private lastReportedScore = -1

  constructor(
    canvas: HTMLCanvasElement,
    handlers?: {
      onGameOver?: GameOverHandler
      onScoreChange?: ScoreChangeHandler
      onPauseChange?: PauseChangeHandler
      onStageChange?: StageChangeHandler
    },
  ) {
    this.onGameOver = handlers?.onGameOver
    this.onScoreChange = handlers?.onScoreChange
    this.onPauseChange = handlers?.onPauseChange
    this.onStageChange = handlers?.onStageChange
    this.scene = this.createScene()
    this.camera = this.createCamera()
    this.renderer = this.createRenderer(canvas)
    this.postProcessing = new PostProcessing(
      this.renderer,
      this.scene,
      this.camera,
    )

    this.addLights()

    this.neonGrid = new NeonGrid()
    this.scene.add(this.neonGrid.group)

    this.geometricWorld = new GeometricWorld()
    this.scene.add(this.geometricWorld.group)

    this.player = new Player()
    this.player.setVisible(false)
    this.scene.add(this.player.group)

    this.obstacles = new ObstacleManager(this.scene)

    this.difficulty.reset(this.stages.getCurrent())
    this.applyStage(true)
    this.input.setPauseHandler(this.togglePause)
    this.timer.connect(document)
    this.input.connect()
    window.addEventListener('resize', this.onResize)
    this.handleResize()
  }

  start(): void {
    if (this.running || this.gameOver) return
    this.running = true
    this.paused = false
    this.onPauseChange?.(false)
    this.soundtrack.play()
    this.renderer.setAnimationLoop(this.tick)
  }

  stop(): void {
    if (!this.running) return
    this.running = false
    this.renderer.setAnimationLoop(null)
  }

  isMusicEnabled(): boolean {
    return this.soundtrack.isEnabled()
  }

  setMusicEnabled(enabled: boolean): void {
    this.soundtrack.setEnabled(enabled)
  }

  togglePause = (): void => {
    if (this.gameOver || this.preview) return

    if (this.paused) {
      this.resume()
    } else {
      this.pause()
    }
  }

  startRun(): void {
    this.preview = false
    this.previewElapsed = 0
    this.beginRun(true)
  }

  /**
   * Full arcade restart: dispose live obstacles, restore baseline state,
   * hide game-over UI (via caller), and resume the animation loop.
   */
  resetGame(): void {
    this.preview = false
    this.beginRun(true)
  }

  dispose(): void {
    this.stop()
    this.timer.disconnect()
    this.input.disconnect()
    window.removeEventListener('resize', this.onResize)

    this.obstacles.dispose()
    this.player.dispose()
    this.neonGrid.dispose()
    this.geometricWorld.dispose()
    this.postProcessing.dispose()
    this.soundtrack.dispose()
    this.renderer.dispose()
  }

  private beginRun(restartMusic: boolean): void {
    this.stop()

    this.obstacles.clear()
    this.player.reset()
    this.player.setVisible(true)
    this.score.reset()
    this.stages.reset()
    this.difficulty.reset(this.stages.getCurrent())
    this.input.reset()
    this.geometricWorld.reset()

    this.lastReportedScore = -1
    this.gameOver = false
    this.paused = false
    this.onScoreChange?.(0)
    this.onPauseChange?.(false)
    this.applyStage(true)

    if (restartMusic) {
      this.soundtrack.restart()
    }

    this.start()
  }

  private readonly tick = (timestamp: number): void => {
    this.timer.update(timestamp)
    const delta = Math.min(this.timer.getDelta(), LOOP.maxDelta)

    if (this.preview) {
      this.updatePreview(delta)
      this.postProcessing.render()
      return
    }

    this.score.update(delta)
    this.reportScoreIfChanged()
    const score = this.score.getScore()

    if (this.stages.update(score)) {
      this.applyStage(false)
    }

    const stage = this.stages.getCurrent()
    this.difficulty.update(delta, stage)
    this.updateEnvironmentColors(delta)

    const scrollSpeed = this.difficulty.getScrollSpeed()
    const spawnInterval = this.difficulty.getSpawnInterval()

    this.player.update(
      delta,
      this.input.consumeLaneDelta(),
      this.input.consumeJump(),
    )
    this.neonGrid.update(delta, scrollSpeed)
    this.geometricWorld.update(delta, scrollSpeed)
    this.obstacles.update(
      delta,
      scrollSpeed,
      spawnInterval,
      stage,
    )

    if (this.obstacles.checkCollisions(this.player.getHitbox())) {
      this.triggerGameOver()
      return
    }

    this.postProcessing.render()
  }

  private updatePreview(delta: number): void {
    this.previewElapsed += delta

    if (this.previewElapsed >= HOME.previewStageInterval) {
      this.previewElapsed = 0
      this.stages.cycle()
      this.obstacles.clear()
      this.difficulty.reset(this.stages.getCurrent())
      this.applyStage(false)
    }

    const stage = this.stages.getCurrent()
    this.difficulty.update(delta, stage)
    this.updateEnvironmentColors(delta)

    const scrollSpeed = this.difficulty.getScrollSpeed()
    const spawnInterval = this.difficulty.getSpawnInterval()

    this.input.consumeLaneDelta()
    this.input.consumeJump()
    this.neonGrid.update(delta, scrollSpeed)
    this.geometricWorld.update(delta, scrollSpeed)
    this.obstacles.update(
      delta,
      scrollSpeed,
      spawnInterval,
      stage,
    )
  }

  private reportScoreIfChanged(): void {
    const current = this.score.getScore()
    if (current === this.lastReportedScore) return
    this.lastReportedScore = current
    this.onScoreChange?.(current)
  }

  private triggerGameOver(): void {
    if (this.gameOver) return
    this.gameOver = true
    this.paused = false
    this.stop()
    this.onPauseChange?.(false)
    this.postProcessing.render()
    this.onGameOver?.(this.score.getScore())
  }

  private createScene(): Scene {
    const scene = new Scene()
    scene.background = this.backgroundColor
    scene.fog = this.fog
    return scene
  }

  private createCamera(): PerspectiveCamera {
    const camera = new PerspectiveCamera(
      CAMERA.fov,
      1,
      CAMERA.near,
      CAMERA.far,
    )
    camera.position.set(CAMERA.offsetX, CAMERA.offsetY, CAMERA.offsetZ)
    camera.lookAt(0, CAMERA.lookAtY, CAMERA.lookAtZ)
    return camera
  }

  private createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, RENDERER.maxPixelRatio),
    )
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = POST_PROCESSING.exposure
    return renderer
  }

  private addLights(): void {
    const ambient = new AmbientLight(COLORS.ambientLight, 0.55)
    const directional = new DirectionalLight(COLORS.directionalLight, 1.1)
    directional.position.set(4, 10, 6)
    this.scene.add(ambient, directional)
  }

  private handleResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    const pixelRatio = Math.min(
      window.devicePixelRatio,
      RENDERER.maxPixelRatio,
    )
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    this.postProcessing.resize(width, height, pixelRatio)
  }

  private pause(): void {
    if (!this.running) return

    this.stop()
    this.paused = true
    this.postProcessing.render()
    this.onPauseChange?.(true)
  }

  private resume(): void {
    if (!this.paused || this.gameOver || this.preview) return

    this.paused = false
    this.running = true
    this.onPauseChange?.(false)
    this.renderer.setAnimationLoop(this.tick)
  }

  private applyStage(immediate: boolean): void {
    const stage = this.stages.getCurrent()
    const palette = stage.palette

    this.targetBackground.set(palette.background)
    this.targetFog.set(palette.fog)
    this.neonGrid.setPalette(
      palette.primary,
      palette.secondary,
      immediate,
    )
    this.geometricWorld.setStageVisuals(
      [palette.primary, palette.secondary, palette.accent],
      stage.activeWorldPieces,
      stage.worldSpeedMultiplier,
      immediate,
    )
    this.postProcessing.setChallengerEffects(stage.afterimage)

    if (immediate) {
      this.backgroundColor.copy(this.targetBackground)
      this.fog.color.copy(this.targetFog)
    }

    this.onStageChange?.(this.stages.getInfo())
  }

  private updateEnvironmentColors(delta: number): void {
    const blend = 1 - Math.exp(-delta * 2.5)
    this.backgroundColor.lerp(this.targetBackground, blend)
    this.fog.color.lerp(this.targetFog, blend)
  }
}
