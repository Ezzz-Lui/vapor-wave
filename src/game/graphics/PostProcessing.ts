import {
  type PerspectiveCamera,
  type Scene,
  Vector2,
  type WebGLRenderer,
} from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { POST_PROCESSING } from '../config/gameConfig'

/**
 * Owns the post-processing pipeline so Game only decides when to render.
 */
export class PostProcessing {
  private readonly composer: EffectComposer
  private readonly renderPass: RenderPass
  private readonly bloomPass: UnrealBloomPass
  private readonly outputPass: OutputPass

  constructor(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
  ) {
    this.renderPass = new RenderPass(scene, camera)
    this.bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      POST_PROCESSING.bloomStrength,
      POST_PROCESSING.bloomRadius,
      POST_PROCESSING.bloomThreshold,
    )
    this.outputPass = new OutputPass()

    this.composer = new EffectComposer(renderer)
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(this.outputPass)
  }

  render(): void {
    this.composer.render()
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.composer.setPixelRatio(pixelRatio)
    this.composer.setSize(width, height)
  }

  dispose(): void {
    this.renderPass.dispose()
    this.bloomPass.dispose()
    this.outputPass.dispose()
    this.composer.dispose()
  }
}
