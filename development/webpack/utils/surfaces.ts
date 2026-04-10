export const WEBPACK_SURFACE_LAYERS = {
  background: 'background',
  ui: 'ui',
  auxiliaryPages: 'auxiliary-pages',
  contentScripts: 'content-scripts',
} as const;

export type WebpackSurface = keyof typeof WEBPACK_SURFACE_LAYERS;

const uiChunkRoots = [
  'bootstrap',
  'ui',
  'home',
  'loading',
  'notification',
  'popup',
  'popup-init',
  'sidepanel',
] as const;

const auxiliaryPageChunkRoots = [
  'offscreen',
  'trezor-usb-permissions',
  'usb-permissions',
] as const;

const backgroundChunkRoots = ['background', 'service-worker.ts'] as const;

const contentScriptChunkRoots = [
  'scripts/contentscript.js',
  'scripts/inpage.js',
  'vendor/trezor/content-script.js',
] as const;

function matchesChunkRoot(
  chunkName: string,
  chunkRoots: readonly string[],
): boolean {
  return chunkRoots.some(
    (chunkRoot) =>
      chunkName === chunkRoot || chunkName.startsWith(`${chunkRoot}.`),
  );
}

export function getWebpackSurfaceFromChunkName(
  chunkName?: string | null,
): WebpackSurface | null {
  if (!chunkName) {
    return null;
  }

  if (matchesChunkRoot(chunkName, backgroundChunkRoots)) {
    return 'background';
  }

  if (matchesChunkRoot(chunkName, uiChunkRoots)) {
    return 'ui';
  }

  if (matchesChunkRoot(chunkName, auxiliaryPageChunkRoots)) {
    return 'auxiliaryPages';
  }

  if (matchesChunkRoot(chunkName, contentScriptChunkRoots)) {
    return 'contentScripts';
  }

  return null;
}

export function getWebpackSurfaceLayer(
  chunkName?: string | null,
): string | undefined {
  const surface = getWebpackSurfaceFromChunkName(chunkName);

  return surface === 'auxiliaryPages'
    ? WEBPACK_SURFACE_LAYERS.auxiliaryPages
    : undefined;
}

export function getWebpackRuntimeChunkName(
  chunkName?: string | null,
): string | false {
  const surface = getWebpackSurfaceFromChunkName(chunkName);

  if (!surface || surface === 'background' || surface === 'contentScripts') {
    return false;
  }

  return surface === 'auxiliaryPages'
    ? 'runtime-auxiliary-pages'
    : 'runtime-ui';
}
