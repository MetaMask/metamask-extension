/**
 * @file Dev-server wiring that auto-reloads the extension when privileged code
 * — the background/service worker, content scripts, or the offscreen document —
 * changes.
 *
 * The UI live-reload client reloads UI pages with `location.reload()`, but that
 * primitive doesn't work for the privileged surfaces: a service worker can't
 * reload itself meaningfully, and a content script can't even call
 * `runtime.reload`. The only way to pick up changes to them is a full
 * `chrome.runtime.reload()`, which must run from a privileged context.
 *
 * So a tiny reloader client (`runtime/devReloadClient`) is injected into the
 * background context, and after each rebuild this module fingerprints the
 * privileged code and announces the fingerprint to all connected clients (and
 * to every client that connects later — so a change built while the client was
 * disconnected, e.g. an idle-terminated service worker, still takes effect on
 * reconnect). The client reloads the extension when the announced fingerprint
 * differs from the one its running code recorded.
 *
 * Fingerprints are computed per *module*, by walking the module graph from the
 * privileged entrypoints. Chunk hashes would be too coarse: the MV2 background
 * page shares the split `js`/`vendor` chunks with the UI pages, so a UI-only
 * edit changes those chunks without changing any code the background actually
 * runs. With module fingerprints, UI-only edits never trigger a reload — the
 * UI live-reload client already handles those, and reloading the extension
 * would needlessly discard background state.
 *
 * All of this is only wired up while the dev server runs (`--watch`), so none
 * of it ships in production builds.
 */

import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import type { Compilation, Compiler, Entrypoint, Module } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import { DEV_RELOAD_MESSAGE_TYPE } from '../runtime/devReloadProtocol';
import type { ManifestPlugin } from './plugins/ManifestPlugin';

/**
 * Entry name for the reloader bundle on MV2 (Firefox), where it is injected as a
 * `<script>` into the background page by `HtmlBundlerPlugin`. On MV3 the reloader
 * is bundled directly into the service worker instead.
 */
export const DEV_RELOAD_CLIENT_ENTRY_NAME = 'dev-reload-client';

/**
 * Matches the entries of privileged HTML pages that cannot self-reload: the
 * MV2 background page (whose `<script>`s are `scripts/load/bootstrap.ts` and
 * `scripts/load/background.ts`) and the MV3 offscreen document.
 * `HtmlBundlerPlugin` registers a page and each of its scripts as separate
 * entries named `<stem>` or `<stem>.<n>` (the numeric suffix de-duplicates
 * stems already taken, e.g. the background page's `background.ts` script
 * becomes `background.1` because the page itself owns `background`), so both
 * forms are matched. `bootstrap` entries also exist for UI pages, but they
 * share the same source file — and that code runs in the background page too,
 * so changes to it genuinely require an extension reload.
 */
const PRIVILEGED_PAGE_ENTRY_RE = /^(?:background|bootstrap|offscreen)(?:\.\d+)?$/u;

/**
 * Finds the {@link ManifestPlugin} instance registered on a compiler. Checked
 * structurally (with a type-only import) because a runtime import of the class
 * would create an import cycle — `ManifestPlugin` imports
 * {@link DEV_RELOAD_CLIENT_ENTRY_NAME} from this module.
 *
 * @param compiler - The compiler to search.
 * @returns The plugin instance, if present.
 */
const findManifestPlugin = (
  compiler: Compiler,
): ManifestPlugin<boolean> | undefined =>
  compiler.options.plugins.find(
    (plugin): plugin is ManifestPlugin<boolean> =>
      typeof plugin === 'object' &&
      plugin !== null &&
      'manifestScriptEntryNames' in plugin,
  );

/**
 * Reads the MV3 service worker's entry name from the manifests —
 * `ManifestPlugin` uses the manifest's `service_worker` filename verbatim as
 * the entry name. Must be called before the first build: `ManifestPlugin`
 * rewrites the manifests' `service_worker` to the output filename during
 * compilation.
 *
 * @param manifestPlugin - The compiler's ManifestPlugin instance.
 * @returns The service worker entry name, or `undefined` on MV2.
 */
const getServiceWorkerEntryName = (
  manifestPlugin: ManifestPlugin<boolean>,
): string | undefined => {
  for (const manifest of manifestPlugin.manifests.values()) {
    if (manifest.manifest_version === 3 && manifest.background) {
      return manifest.background.service_worker;
    }
  }
  return undefined;
};

/**
 * Collects the hash of every module reachable from an entrypoint, by walking
 * the module graph from the entry modules of the entrypoint's chunks. This
 * covers dynamic imports (the service worker pulls in nearly all of its code
 * via `import('./scripts/background.js')`) and, unlike chunk hashes, is not
 * polluted by unrelated modules that merely share a split chunk.
 *
 * @param compilation - The finished compilation.
 * @param entrypoint - The entrypoint to walk.
 * @param hashes - The array to append the module hashes to.
 */
const collectEntrypointModuleHashes = (
  compilation: Compilation,
  entrypoint: Entrypoint,
  hashes: string[],
): void => {
  const { chunkGraph, moduleGraph } = compilation;
  const { runtime } = entrypoint.getEntrypointChunk();
  const queue: Module[] = [];
  const seen = new Set<Module>();
  for (const chunk of entrypoint.chunks) {
    for (const module of chunkGraph.getChunkEntryModulesIterable(chunk)) {
      if (!seen.has(module)) {
        seen.add(module);
        queue.push(module);
      }
    }
  }
  while (queue.length > 0) {
    const module = queue.pop() as Module;
    try {
      hashes.push(chunkGraph.getModuleHash(module, runtime));
    } catch {
      // The module has no hash for this runtime (e.g. the target of an
      // inactive connection that isn't actually bundled) — skip it.
    }
    for (const connection of moduleGraph.getOutgoingConnections(module)) {
      const target = connection.module;
      if (target && !seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
};

/**
 * Fingerprints all privileged code in a compilation: the module hashes of
 * everything reachable from the manifest-script entrypoints (content scripts,
 * background scripts, the service worker) and the privileged page entrypoints,
 * digested into a single stable string.
 *
 * @param compilation - The finished compilation.
 * @param manifestScriptEntryNames - Entry names registered from the manifests.
 * @returns The fingerprint of the compilation's privileged code.
 */
const fingerprintCompilation = (
  compilation: Compilation,
  manifestScriptEntryNames: ReadonlySet<string>,
): string => {
  const hashes: string[] = [];
  for (const [name, entrypoint] of compilation.entrypoints) {
    if (
      manifestScriptEntryNames.has(name) ||
      PRIVILEGED_PAGE_ENTRY_RE.test(name)
    ) {
      collectEntrypointModuleHashes(compilation, entrypoint, hashes);
    }
  }
  // Sort to be independent of graph traversal order, which webpack does not
  // guarantee to be stable between rebuilds.
  return createHash('sha256').update(hashes.sort().join('\n')).digest('hex');
};

/**
 * Wires up automatic extension reloading on the running dev server. For each
 * compiler it injects the reloader client into the background context (bundled
 * into the MV3 service worker, or registered as a standalone entry that
 * `HtmlBundlerPlugin` injects into the MV2 background page). After every
 * successful rebuild it fingerprints the privileged code and announces the
 * fingerprint via {@link DEV_RELOAD_MESSAGE_TYPE} — to all connected clients
 * and to every client that connects later. The reloader client decides whether
 * to reload by comparing against the fingerprint of its own running code, so
 * there are no reload loops on startup and no missed reloads after a
 * disconnect.
 *
 * Called from `DEV_SERVER_OPTIONS.setupMiddlewares`, where the resolved
 * dev-server port is known.
 *
 * @param devServer - The running webpack dev server.
 * @param compilers - The compilers attached to the dev server.
 */
export function setupDevReload(
  devServer: WebpackDevServer,
  compilers: Compiler[],
): void {
  // The dev server's WebSocket URL; `port: 'auto'` has already been resolved
  // to the real port by the time `setupMiddlewares` calls this.
  const { host, port } = devServer.options;
  const url = `ws://${host ?? 'localhost'}:${port}/ws`;
  const reloaderRequest = `${resolve(__dirname, '../runtime/devReloadClient.ts')}?url=${encodeURIComponent(url)}`;

  // The latest fingerprint per compiler, combined into the announced payload.
  const fingerprints = new Map<Compiler, string>();
  let announced: string | undefined;
  let connectionListenerInstalled = false;

  const announce = (): void => {
    const server = devServer.webSocketServer;
    if (!server) {
      // Not created yet (it appears early in `WebpackDevServer.start()`, long
      // before the first build finishes); the next build re-announces.
      return;
    }
    if (!connectionListenerInstalled) {
      connectionListenerInstalled = true;
      // Push the current fingerprint to every (re)connecting client, so a
      // change built while the client was disconnected (e.g. the MV3 service
      // worker was idle-terminated by the browser) still triggers a reload.
      // `implementation` is the underlying `ws` server (the default transport).
      server.implementation.on('connection', (socket) => {
        if (announced !== undefined) {
          devServer.sendMessage([socket], DEV_RELOAD_MESSAGE_TYPE, announced);
        }
      });
    }
    const payload = [...fingerprints.values()].sort().join('|');
    if (announced !== undefined && payload !== announced) {
      console.error(
        '🦊 Background or content script changed — reloading extension…',
      );
    }
    announced = payload;
    devServer.sendMessage(server.clients, DEV_RELOAD_MESSAGE_TYPE, payload);
  };

  for (const compiler of compilers) {
    const manifestPlugin = findManifestPlugin(compiler);
    if (!manifestPlugin) {
      continue;
    }
    const { manifestScriptEntryNames } = manifestPlugin;
    const serviceWorkerEntryName = getServiceWorkerEntryName(manifestPlugin);

    const { EntryPlugin } = compiler.webpack;
    if (serviceWorkerEntryName) {
      // MV3: the service worker loads exactly one file, so the reloader must be
      // part of that chunk. Pass only `name` so webpack merges this dependency
      // into the existing entry without a conflicting-entry-option error.
      new EntryPlugin(compiler.context, reloaderRequest, {
        name: serviceWorkerEntryName,
      }).apply(compiler);
    } else {
      // MV2: register a standalone entry; `HtmlBundlerPlugin.beforeEmit` injects
      // it as a `<script>` into the background page.
      new EntryPlugin(compiler.context, reloaderRequest, {
        name: DEV_RELOAD_CLIENT_ENTRY_NAME,
        chunkLoading: false,
      }).apply(compiler);
    }

    compiler.hooks.done.tap('MetaMaskDevReload', (stats) => {
      // Don't announce a broken build; keep the last good fingerprint so the
      // next successful build is compared against it.
      if (stats.hasErrors()) {
        return;
      }
      fingerprints.set(
        compiler,
        fingerprintCompilation(stats.compilation, manifestScriptEntryNames),
      );
      announce();
    });
  }
}
