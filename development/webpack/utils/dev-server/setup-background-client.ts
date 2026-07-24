import { createHash } from 'node:crypto';
import type { Compilation, Compiler, Entrypoint, Module } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import { ManifestPlugin } from '../plugins/ManifestPlugin';
import {
  BACKGROUND_CLIENT_ENTRY_NAME,
  BACKGROUND_UPDATE_MESSAGE_TYPE,
  UI_UPDATE_MESSAGE_TYPE,
} from './protocol';
import { createAnnouncer, getClientRequest } from './websocket';

/**
 * Matches the entries of privileged HTML pages that cannot self-reload: the
 * MV2 background page (whose `<script>`s are `scripts/load/init-statehooks.ts`,
 * `scripts/load/init-sentry.ts`, and `scripts/load/background.ts`) and the MV3
 * offscreen document (whose shared state hook initializer is
 * `scripts/load/init-statehooks.ts`).
 * `HtmlBundlerPlugin` registers a page and each of its scripts as separate
 * entries named `<stem>` or `<stem>.<n>` (the numeric suffix de-duplicates
 * stems already taken, e.g. the background page's `background.ts` script
 * becomes `background.1` because the page itself owns `background`), so both
 * forms are matched. `init-statehooks` and `init-sentry` entries also exist
 * for UI pages, but they share the same source files — and those code paths
 * run in the background page too, so changes to them genuinely require an
 * extension reload.
 */
const PRIVILEGED_PAGE_ENTRY_RE =
  /^(?:background|offscreen|init-statehooks|init-sentry)(?:\.\d+)?$/u;

/**
 * Finds the {@link ManifestPlugin} instance registered on a compiler.
 *
 * @param compiler - The compiler to search.
 * @returns The plugin instance, if present.
 */
const findManifestPlugin = (
  compiler: Compiler,
): ManifestPlugin<boolean> | undefined =>
  compiler.options.plugins.find(
    (plugin): plugin is ManifestPlugin<boolean> =>
      plugin instanceof ManifestPlugin,
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
 * @param seen - Modules already visited; shared across entrypoints so graphs
 * they have in common (each page has its own `init-statehooks`/`init-sentry`
 * entries over the same modules) are only walked and hashed once. A source
 * change updates a module's hash under every runtime, so deduplication doesn't
 * lose change detection.
 * @param hashes - The array to append the module hashes to.
 */
const collectEntrypointModuleHashes = (
  compilation: Compilation,
  entrypoint: Entrypoint,
  seen: Set<Module>,
  hashes: string[],
): void => {
  const { chunkGraph, moduleGraph } = compilation;
  const { runtime } = entrypoint.getEntrypointChunk();
  const queue: Module[] = [];
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
  const seen = new Set<Module>();
  const hashes: string[] = [];
  for (const [name, entrypoint] of compilation.entrypoints) {
    if (
      manifestScriptEntryNames.has(name) ||
      PRIVILEGED_PAGE_ENTRY_RE.test(name)
    ) {
      collectEntrypointModuleHashes(compilation, entrypoint, seen, hashes);
    }
  }
  // Sort to be independent of graph traversal order, which webpack does not
  // guarantee to be stable between rebuilds.
  return createHash('sha256').update(hashes.sort().join('\n')).digest('hex');
};

/**
 * Wires up automatic extension reloading on the running dev server. For each
 * compiler it injects the background client into the background context
 * (bundled into the MV3 service worker, or registered as a standalone entry
 * that `HtmlBundlerPlugin` injects into the MV2 background page). After every
 * successful rebuild it fingerprints the privileged code and announces the
 * fingerprint via {@link BACKGROUND_UPDATE_MESSAGE_TYPE} — to all connected
 * clients and to every client that connects later. The client decides whether
 * to reload by comparing against the fingerprint of its own running code, so
 * there are no reload loops on startup and no missed reloads after a
 * disconnect. Builds that leave the fingerprint unchanged didn't touch
 * privileged code, so the UI build hash is announced instead (via
 * {@link UI_UPDATE_MESSAGE_TYPE}) so that UI pages can hot-update themselves.
 *
 * @param devServer - The running webpack dev server.
 * @param compilers - The compilers attached to the dev server.
 */
export function setupBackgroundClient(
  devServer: WebpackDevServer,
  compilers: Compiler[],
): void {
  const backgroundClientRequest = getClientRequest(
    devServer,
    'background-client.ts',
  );

  const announceFingerprint = createAnnouncer(
    devServer,
    BACKGROUND_UPDATE_MESSAGE_TYPE,
  );
  const announceHash = createAnnouncer(devServer, UI_UPDATE_MESSAGE_TYPE);

  // The fingerprint of each compiler's last good build, for deciding whether
  // a build needs an extension reload or a UI hot update.
  const fingerprints = new Map<Compiler, string>();

  for (const compiler of compilers) {
    const manifestPlugin = findManifestPlugin(compiler);
    if (!manifestPlugin) {
      continue;
    }
    const serviceWorkerEntryName = getServiceWorkerEntryName(manifestPlugin);

    if (serviceWorkerEntryName) {
      // MV3: the service worker loads exactly one file, so the client must be
      // part of that chunk. Pass only `name` so webpack merges this dependency
      // into the existing entry without a conflicting-entry-option error.
      new compiler.webpack.EntryPlugin(
        compiler.context,
        backgroundClientRequest,
        { name: serviceWorkerEntryName },
      ).apply(compiler);
    } else {
      // MV2: register a standalone entry; `HtmlBundlerPlugin.beforeEmit` injects
      // it as a `<script>` into the background page.
      new compiler.webpack.EntryPlugin(
        compiler.context,
        backgroundClientRequest,
        {
          name: BACKGROUND_CLIENT_ENTRY_NAME,
          chunkLoading: false,
        },
      ).apply(compiler);
    }

    compiler.hooks.done.tap('MetaMaskBackgroundClient', (stats) => {
      // Don't announce a broken build; keep the last good fingerprint so the
      // next successful build is compared against it.
      if (stats.hasErrors()) {
        return;
      }
      const previous = fingerprints.get(compiler);
      const next = fingerprintCompilation(
        stats.compilation,
        manifestPlugin.addedScripts,
      );
      fingerprints.set(compiler, next);
      announceFingerprint(compiler, next);
      // An unchanged fingerprint means no extension reload is coming to tear
      // the UI pages down, so the UI build hash is announced so that the pages
      // can hot-update themselves. The first build of a server session announces too:
      // a page kept open across a dev-server restart would otherwise never
      // learn that its code changed.
      if (previous === undefined || previous === next) {
        announceHash(compiler, stats.compilation.hash ?? '');
      }
    });
  }
}
