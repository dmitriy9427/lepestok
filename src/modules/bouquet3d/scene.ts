/**
 * Сцена с 3D-букетом (three.js). Модель — public/models/bouquet.glb,
 * её собирает скрипт Blender: blender/bouquet.py (см. blender/README.md).
 *
 * Свет: RoomEnvironment — «комната» из светящихся панелей вместо HDR-файла:
 * мягкие блики без лишних 1–2 МБ. Плюс тёплый направленный свет сверху.
 * Тон — ACES (как в кино): насыщенные цвета не «выгорают» в белое.
 */
import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  Group,
  PerspectiveCamera,
  PMREMGenerator,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export async function createBouquetScene(container: HTMLElement, url: string, dpr: number) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(dpr)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9
  renderer.domElement.className = 'bouquet3d__canvas'

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.65 // иначе светлая плёнка «выгорает» в белое
  pmrem.dispose()
  const sun = new DirectionalLight('#fff1e6', 1.6)
  sun.position.set(3, 6, 4)
  scene.add(sun)

  const camera = new PerspectiveCamera(30, 1, 0.1, 100)

  const gltf = await new GLTFLoader().loadAsync(url)
  const model = gltf.scene

  // Центрируем модель: вращение — вокруг оси букета, а не угла сцены.
  const box = new Box3().setFromObject(model)
  const center = box.getCenter(new Vector3())
  const size = box.getSize(new Vector3())
  model.position.sub(center)
  const pivot = new Group()
  pivot.add(model)
  scene.add(pivot)
  const radius = size.length() / 2
  camera.position.set(0, radius * 0.5, radius * 2.45)
  camera.lookAt(0, 0, 0)

  container.appendChild(renderer.domElement)

  return {
    resize(width: number, height: number) {
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    },
    /** rotation — угол вокруг вертикали, tilt — наклон, float — покачивание. */
    render(rotation: number, tilt: number, float: number) {
      pivot.rotation.y = rotation
      pivot.rotation.x = tilt
      pivot.position.y = float
      renderer.render(scene, camera)
    },
    dispose() {
      scene.traverse((obj: Object3D) => {
        const mesh = obj as Object3D & {
          geometry?: { dispose(): void }
          material?: { dispose(): void } | { dispose(): void }[]
        }
        mesh.geometry?.dispose()
        ;[mesh.material].flat().forEach((m) => m?.dispose())
      })
      scene.environment?.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
