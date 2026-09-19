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
  LOOP,
  POST_PROCESSING,
  RENDERER,
} from '../config/gameConfig'
import { Player } from '../entities/Player'
import { GeometricWorld } from '../environment/GeometricWorld'
import { NeonGrid } from '../environment/NeonGrid'
import { PostProcessing } from '../graphics/PostProcessing'
import { KeyboardInput } from '../input/KeyboardInput'
import { DifficultySystem } from '../systems/DifficultySystem'
import { ObstacleManager } from '../systems/ObstacleManager'
import { ScoreSystem } from '../systems/ScoreSystem'

export type GameOverHandler = (finalScore: number) => void
export type ScoreChangeHandler = (score: number) => void

export class Game {
  private readonly scene: Scene
  private readonly camera: PerspectiveCamera
  private readonly renderer: WebGLRenderer
  private readonly postProcessing: PostProcessing
  private readonly timer = new Timer()
  private readonly input = new KeyboardInput()
  private readonly player: Player
  private readonly neonGrid: NeonGrid
  private readonly geometricWorld: GeometricWorld
  private readonly obstacles: ObstacleManager
  private readonly score = new ScoreSystem()
  private readonly difficulty = new DifficultySystem()
  private readonly onGameOver?: GameOverHandler
  private readonly onScoreChange?: ScoreChangeHandler
  private readonly onResize = (): void => {
    this.handleResize()
  }

  private running = false
  private gameOver = false
  private lastReportedScore = -1

  constructor(
    canvas: HTMLCanvasElement,
    handlers?: {
      onGameOver?: GameOverHandler
      onScoreChange?: ScoreChangeHandler
    },
  ) {
    this.onGameOver = handlers?.onGameOver
    this.onScoreChange = handlers?.onScoreChange
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
    this.scene.add(this.player.group)

    this.obstacles = new ObstacleManager(this.scene)

    this.timer.connect(document)
    this.input.connect()
    window.addEventListener('resize', this.onResize)
    this.handleResize()
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.gameOver = false
    this.renderer.setAnimationLoop(this.tick)
  }

  stop(): void {
    if (!this.running) return
    this.running = false
    this.renderer.setAnimationLoop(null)
  }

  /**
   * Full arcade restart: dispose live obstacles, restore baseline state,
   * hide game-over UI (via caller), and resume the animation loop.
   */
  resetGame(): void {
    this.stop()

    this.obstacles.clear()
    this.player.reset()
    this.score.reset()
    this.difficulty.reset()
    this.input.reset()
    this.geometricWorld.reset()

    this.lastReportedScore = -1
    this.gameOver = false
    this.onScoreChange?.(0)

    this.start()
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
    this.renderer.dispose()
  }

  private readonly tick = (timestamp: number): void => {
    this.timer.update(timestamp)
    const delta = Math.min(this.timer.getDelta(), LOOP.maxDelta)

    this.difficulty.update(delta)
    this.score.update(delta)
    this.reportScoreIfChanged()

    const scrollSpeed = this.difficulty.getScrollSpeed()
    const spawnInterval = this.difficulty.getSpawnInterval()

    this.player.update(delta, this.input.consumeLaneDelta())
    this.neonGrid.update(delta, scrollSpeed)
    this.geometricWorld.update(delta, scrollSpeed)
    this.obstacles.update(delta, scrollSpeed, spawnInterval)

    if (this.obstacles.checkCollisions(this.player.getHitbox())) {
      this.triggerGameOver()
      return
    }

    this.postProcessing.render()
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
    this.stop()
    this.postProcessing.render()
    this.onGameOver?.(this.score.getScore())
  }

  private createScene(): Scene {
    const scene = new Scene()
    const bg = new Color(COLORS.background)
    scene.background = bg
    scene.fog = new Fog(COLORS.fog, FOG.near, FOG.far)
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
}
