import type { Camera, Scene, Texture, WebGLRenderer } from 'three';

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

export async function prepareBookRenderer(
  renderer: Pick<WebGLRenderer, 'initTexture' | 'compileAsync'>,
  textures: Texture[],
  scene: Scene,
  camera: Camera,
  active: () => boolean,
  yieldFrame = nextFrame,
) {
  // Let the mounted, initially hidden pages register their materials first.
  await yieldFrame();
  await yieldFrame();
  for (const texture of new Set(textures)) {
    if (!active()) return false;
    renderer.initTexture(texture);
    await yieldFrame();
  }
  if (!active()) return false;
  await renderer.compileAsync(scene, camera);
  await yieldFrame();
  return active();
}
