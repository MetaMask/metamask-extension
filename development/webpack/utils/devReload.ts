/**
 * @file Dev-server wiring that auto-reloads the extension when the background,
 * service worker, or content scripts change.
 *
 * The UI live-reload client reloads UI pages with `location.reload()`, but that
 * primitive doesn't work for the service worker, the background page, or content
 * scripts. The only way to pick up changes to those surfaces is a full
 * `chrome.runtime.reload()`, which must run from a privileged context.
 *
 * So a tiny reloader client (`runtime/devReloadClient`) is injected into the
 * background context, and after each rebuild this module fingerprints the
 * background and content-script entrypoints and broadcasts a reload message when
 * any of them changed. UI-only edits never trigger a reload — the UI live-reload
 * client already handles those, and reloading the extension would needlessly
 * discard background state.
 *
 * All of this is only wired up while the dev server runs (`--watch`), so none of
 * it ships in production builds.
 */

import { resolve } from 'node:path';
import type { Compiler, Entrypoint, Stats } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import { DEV_RELOAD_MESSAGE_TYPE } from '../runtime/devReloadProtocol';
import { getDevServerWsParams } from './helpers';

/**
 * Entry name for the reloader bundle on MV2 (Firefox), where it is injected as a
 * `<script>` into the background page by `HtmlBundlerPlugin`. On MV3 the reloader
 * is bundled directly into the service worker instead.
 */
export const DEV_RELOAD_CLIENT_ENTRY_NAME = 'dev-reload-client';

/**
 * Webpack entry name of the MV3 service worker — its manifest `service_worker`
 * filename, which `ManifestPlugin` uses verbatim as the entry name.
 */
const SERVICE_WORKER_ENTRY_NAME = 'service-worker.ts';

/**
 * Webpack entry names whose code runs in the background context. Editing any of
 * them requires a full extension reload.
 */
export const BACKGROUND_ENTRY_NAMES = [
  SERVICE_WORKER_ENTRY_NAME, // MV3 (Chrome) service worker
  'background', // MV2 (Firefox) background page
] as const;

/**
 * Webpack entry names for content scripts. Editing any of them requires a full
 * extension reload so the new scripts are (re)registered.
 */
export const CONTENT_SCRIPT_ENTRY_NAMES = [
  'scripts/contentscript.js',
  'scripts/inpage.js',
  'vendor/trezor/content-script.js',
] as const;

/**
 * Entries whose changes require a full extension reload (background, service
 * worker, or content script) rather than a UI live-reload.
 */
const RELOAD_TRIGGERING_ENTRIES = new Set<string>([
  ...BACKGROUND_ENTRY_NAMES,
  ...CONTENT_SCRIPT_ENTRY_NAMES,
]);

/**
 * Fingerprints an entrypoint's emitted code from its chunk hashes, used to
 * detect whether the entry's output changed between rebuilds. Includes async
 * chunks, not just initial ones: the service worker pulls in nearly all of its
 * code via a dynamic `import('./scripts/background.js')`, so the background
 * bundles only ever appear as async chunks of the entry.
 *
 * @param entrypoint - A webpack entrypoint.
 * @returns A string fingerprint of the entrypoint's chunks.
 */
const fingerprintEntrypoint = (entrypoint: Entrypoint): string => {
  const chunks = [
    ...entrypoint.chunks,
    ...entrypoint.getEntrypointChunk().getAllAsyncChunks(),
  ];
  return chunks
    .map((chunk) => chunk.renderedHash ?? chunk.hash ?? '')
    .sort() // chunk traversal order isn't guaranteed to be stable
    .join('|');
};

/**
 * Wires up automatic extension reloading for a compiler on the running dev
 * server. It injects the reloader client into the background context (bundled
 * into the MV3 service worker, or registered as a standalone entry that
 * `HtmlBundlerPlugin` injects into the MV2 background page), then after every
 * successful rebuild fingerprints the background and content-script entrypoints
 * and broadcasts {@link DEV_RELOAD_MESSAGE_TYPE} when any of them changed.
 *
 * The first build of each entry is only recorded (never signaled), and messages
 * are only sent for genuine post-startup changes, so there are no reload loops on
 * startup.
 *
 * Called from `DEV_SERVER_OPTIONS.setupMiddlewares`, where the resolved
 * dev-server port is known.
 *
 * @param compiler - A compiler attached to the dev server.
 * @param devServer - The running webpack dev server.
 */
export function setupDevReload(
  compiler: Compiler,
  devServer: WebpackDevServer,
): void {
  // Pass the resolved WebSocket connection details (notably the auto-assigned
  // port) to the reloader via its `__resourceQuery`.
  const params = getDevServerWsParams(devServer.options).toString();
  const reloaderRequest = `${resolve(__dirname, '../runtime/devReloadClient.ts')}?${params}`;

  const { EntryPlugin } = compiler.webpack;
  // `ManifestPlugin` has already registered the manifest entries on the
  // compiler (its `entryOption` hook ran when the compiler was created), so the
  // presence of the service-worker entry tells us which background flavor this
  // build uses.
  const { entry } = compiler.options;
  if (typeof entry === 'object' && SERVICE_WORKER_ENTRY_NAME in entry) {
    // MV3: the service worker loads exactly one file, so the reloader must be
    // part of that chunk. Pass only `name` so webpack merges this dependency
    // into the existing entry without a conflicting-entry-option error.
    new EntryPlugin(compiler.context, reloaderRequest, {
      name: SERVICE_WORKER_ENTRY_NAME,
    }).apply(compiler);
  } else {
    // MV2: register a standalone entry; `HtmlBundlerPlugin.beforeEmit` injects
    // it as a `<script>` into the background page.
    new EntryPlugin(compiler.context, reloaderRequest, {
      name: DEV_RELOAD_CLIENT_ENTRY_NAME,
      chunkLoading: false,
    }).apply(compiler);
  }

  // Track each relevant entry's output fingerprint across rebuilds so we only
  // reload when a background/content-script bundle actually changed.
  const previousFingerprints = new Map<string, string>();
  compiler.hooks.done.tap('MetaMaskDevReload', (stats: Stats) => {
    // Don't reload to a broken build; leave fingerprints untouched so the next
    // successful build is compared against the last good one.
    if (stats.hasErrors()) {
      return;
    }

    let changed = false;
    for (const [name, entrypoint] of stats.compilation.entrypoints) {
      if (!RELOAD_TRIGGERING_ENTRIES.has(name)) {
        continue;
      }
      const fingerprint = fingerprintEntrypoint(entrypoint);
      const previous = previousFingerprints.get(name);
      // Skip the first time we see each entry: record without signaling.
      if (previous !== undefined && previous !== fingerprint) {
        changed = true;
      }
      previousFingerprints.set(name, fingerprint);
    }

    if (changed) {
      const clients = devServer.webSocketServer?.clients;
      if (clients?.length) {
        // webpack-dev-middleware's `writeToDisk` runs during the emit phase,
        // so the new files are on disk by the time this `done` hook fires.
        console.error(
          '🦊 Reloading extension (background or content script changed)…',
        );
        devServer.sendMessage(clients, DEV_RELOAD_MESSAGE_TYPE);
      }
    }
  });
}
