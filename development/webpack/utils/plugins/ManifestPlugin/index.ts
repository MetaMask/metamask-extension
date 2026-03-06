import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import {
  sources,
  ProgressPlugin,
  Compilation,
  type Compiler,
  type Asset,
  type EntryOptions,
} from 'webpack';
import { validate } from 'schema-utils';
import {
  type DeflateOptions,
  Zip,
  AsyncZipDeflate,
  ZipPassThrough,
} from 'fflate';
import { noop, extensionToJs, type Manifest, Browser } from '../../helpers';
import { schema } from './schema';
import type { ManifestPluginOptions } from './types';

const { RawSource, ConcatSource } = sources;

export type EntryDescriptionNormalized = { import?: string[] } & Omit<
  EntryOptions,
  'name'
>;
const NAME = 'ManifestPlugin';
const BROWSER_TEMPLATE_RE = /\[browser\]/gu;

/**
 * Adds the given asset to the zip file
 *
 * @param asset - The asset to add
 * @param assetName - The name of the asset
 * @param compress - Whether to compress the asset
 * @param compressionOptions - The options to use for compression
 * @param mtime - The modification time of the asset
 * @param zip - The zip file to add the asset to
 */
function addAssetToZip(
  asset: Buffer,
  assetName: string,
  compress: boolean,
  compressionOptions: DeflateOptions | undefined,
  mtime: number,
  zip: Zip,
): void {
  const zipFile = compress
    ? // AsyncZipDeflate uses workers
      new AsyncZipDeflate(assetName, compressionOptions)
    : // ZipPassThrough doesn't use workers
      new ZipPassThrough(assetName);
  zipFile.mtime = mtime;
  zip.add(zipFile);
  // Use a copy of the Buffer via `Buffer.from(asset)`, as Zip will *consume*
  // it, which breaks things if we are compiling for multiple browsers at once.
  // `Buffer.from` uses the internal pool, so it's superior to `new Uint8Array`
  // if we don't need to pass it off to a worker thread.
  //
  // Additionally, in Node.js 22+ a Buffer marked as "Untransferable" (like
  // ours) can't be passed to a worker, which `AsyncZipDeflate` uses.
  // See: https://github.com/101arrowz/fflate/issues/227#issuecomment-2540024304
  // this can probably be simplified to `zipFile.push(Buffer.from(asset), true);`
  // if the above issue is resolved.
  zipFile.push(compress ? new Uint8Array(asset) : Buffer.from(asset), true);
}

/**
 * A webpack plugin that generates extension manifests for browsers and organizes
 * assets into browser-specific directories and optionally zips them.
 *
 */
export class ManifestPlugin<Z extends boolean> {
  /**
   * File types that can be compressed well using DEFLATE compression, used when
   * zipping assets.
   */
  static compressibleFileTypes = new Set([
    '.bmp',
    '.cjs',
    '.css',
    '.csv',
    '.eot',
    '.html',
    '.js',
    '.json',
    '.log',
    '.map',
    '.md',
    '.mjs',
    '.svg',
    '.txt',
    '.wasm',
    '.vtt', // very slow to process?
    '.wav',
    '.xml',
  ]);

  options: ManifestPluginOptions<Z>;

  manifests: Map<Browser, Manifest> = new Map();

  private manifestSources: Map<Browser, sources.RawSource> = new Map();

  private watchedFiles: string[] = [];

  private addedScripts: Set<string> = new Set();

  private selfContainedScripts: Set<string> = new Set([
    'snow.prod',
    'use-snow',
    'bootstrap',
  ]);

  /**
   * Returns `true` if the given entrypoint can be split into chunks.
   * Scripts found in the extension manifest must be self-contained and cannot
   * be chunked.
   *
   * @param entrypoint - The entrypoint to check.
   * @param entrypoint.name - The name of the entrypoint.
   * @returns `true` if the entrypoint can be split into chunks.
   */
  canBeChunked = ({ name }: { name?: string | null }): boolean => {
    return !name || !this.selfContainedScripts.has(name);
  };

  constructor(options: ManifestPluginOptions<Z>) {
    validate(schema, options, { name: NAME });
    this.options = options;
  }

  apply(compiler: Compiler) {
    // Collect entrypoints from the manifest files and add them to webpack's entries
    // This only runs once at the beginning of the compilation, so changes to entrypoints
    // won't be registered. However, adding/removing entrypoints is a pretty major change
    // that likely requires a full restart, so this seems acceptable.
    compiler.hooks.entryOption.tap(NAME, (_context, entries) => {
      this.prepareManifests(compiler);
      this.collectEntrypoints(
        compiler,
        entries as Record<string, EntryDescriptionNormalized>,
      );
    });

    // Hook into the compilation to resolve entrypoints, move/zip assets
    compiler.hooks.compilation.tap(NAME, this.hookIntoPipelines.bind(this));

    // Watch files so that changes to them trigger a rebuild
    compiler.hooks.afterCompile.tap(NAME, (compilation) => {
      for (const watchedFile of this.watchedFiles) {
        compilation.fileDependencies.add(watchedFile);
      }
    });
  }

  private async zipAssets(
    compilation: Compilation,
    options: ManifestPluginOptions<true>,
  ): Promise<void> {
    // TODO(perf): this zips (and compresses) every file individually for each
    // browser. Can we share the compression and crc steps to save time?
    const { browsers, zipOptions } = options;
    const { excludeExtensions, level, outFilePath, mtime } = zipOptions;
    const compressionOptions: DeflateOptions = { level };

    const assetsByBrowser = new Map<
      string,
      { browserRelativePath: string; asset: Readonly<Asset> }[]
    >();
    for (const browser of browsers) {
      assetsByBrowser.set(browser, []);
    }
    for (const asset of compilation.getAssets()) {
      for (const browser of browsers) {
        const browserPrefix = `${browser}/`;
        if (!asset.name.startsWith(browserPrefix)) {
          continue;
        }
        const browserRelativePath = asset.name.slice(browserPrefix.length);
        // manifest.json is added manually to the root of each zip
        if (browserRelativePath === 'manifest.json') {
          continue;
        }
        assetsByBrowser.get(browser)?.push({ browserRelativePath, asset });
      }
    }

    let filesProcessed = 0;
    const totalWork =
      browsers.reduce(
        (sum, browser) => sum + (assetsByBrowser.get(browser)?.length ?? 0),
        0,
      ) + browsers.length; // +1 manifest.json per browser zip
    const reportProgress =
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      ProgressPlugin.getReporter(compilation.compiler) || noop;
    // TODO(perf): run this in parallel. If you try without carefully optimizing the
    // process will run out of memory pretty quickly, and crash. Fun!
    for (const browser of browsers) {
      const manifest = this.manifestSources.get(browser) as sources.RawSource;
      const source = await new Promise<sources.Source>((resolve, reject) => {
        // since Zipping is async, a past chunk could cause an error after we've
        // started processing additional chunks. We'll use this errored flag to
        // short-circuit the rest of the processing if that happens.
        let errored = false;
        const zipSource = new ConcatSource();
        const zip = new Zip((error, data, final) => {
          if (errored) return; // ignore additional errors
          if (error) {
            // set error flag to prevent additional processing
            errored = true;
            reject(error);
          } else {
            zipSource.add(new RawSource(Buffer.from(data)));
            // we've received our final bit of data, return the zipSource
            if (final) resolve(zipSource);
          }
        });

        // add the browser's manifest.json file to the zip
        addAssetToZip(
          manifest.buffer(),
          'manifest.json',
          true,
          compressionOptions,
          mtime,
          zip,
        );

        const message = `${++filesProcessed}/${totalWork} assets zipped for ${browser}`;
        reportProgress(0, message, 'manifest.json');

        for (const { browserRelativePath, asset } of assetsByBrowser.get(
          browser,
        ) ?? []) {
          if (errored) return;

          const extName = path.extname(browserRelativePath);
          if (excludeExtensions.includes(extName)) continue;

          addAssetToZip(
            asset.source.buffer(),
            browserRelativePath,
            ManifestPlugin.compressibleFileTypes.has(extName),
            compressionOptions,
            mtime,
            zip,
          );
          reportProgress(
            0,
            `${++filesProcessed}/${totalWork} assets zipped for ${browser}`,
            browserRelativePath,
          );
        }

        zip.end();
      });

      // add the zip file to webpack's assets.
      const zipFilePath = outFilePath.replace(BROWSER_TEMPLATE_RE, browser);
      compilation.emitAsset(zipFilePath, source, {
        javascriptModule: false,
        compressed: true,
        contentType: 'application/zip',
        development: true,
      });
    }
  }

  /**
   * Moves the assets to the correct browser locations and adds each browser's
   * extension manifest.json file to the list of assets. For one browser, this
   * uses `renameAsset` to preserve asset metadata relationships.
   *
   * Note: This method uses `path.posix.join` instead of `path.join` because
   * webpack asset names are expected to use forward slashes. On Windows,
   * `path.join` would produce backslashes, which can cause mismatches with
   * webpack internals that normalize asset names to forward slashes.
   *
   * @param compilation
   * @param options
   */
  private moveAssets(
    compilation: Compilation,
    options: ManifestPluginOptions<false>,
  ): void {
    const { browsers } = options;
    const [primaryBrowser, ...extraBrowsers] = browsers;

    // Snapshot asset names before emitting any browser-prefixed assets.
    const baseAssetNames = Object.keys(compilation.assets);

    const primaryManifest = this.manifestSources.get(
      primaryBrowser,
    ) as sources.RawSource;
    compilation.emitAsset(
      path.posix.join(primaryBrowser, 'manifest.json'),
      primaryManifest,
      {
        javascriptModule: false,
        contentType: 'application/json',
      },
    );

    // Rename to the primary browser output path so we keep webpack asset links.
    for (const name of baseAssetNames) {
      const primaryAssetName = path.posix.join(primaryBrowser, name);
      compilation.renameAsset(name, primaryAssetName);
    }

    for (const browser of extraBrowsers) {
      const manifest = this.manifestSources.get(browser) as sources.RawSource;
      compilation.emitAsset(
        path.posix.join(browser, 'manifest.json'),
        manifest,
        {
          javascriptModule: false,
          contentType: 'application/json',
        },
      );
      for (const name of baseAssetNames) {
        const primaryAssetName = path.posix.join(primaryBrowser, name);
        const primaryAsset = compilation.getAsset(
          primaryAssetName,
        ) as Readonly<Asset>;
        compilation.emitAsset(
          path.posix.join(browser, name),
          primaryAsset.source,
          {
            ...primaryAsset.info,
          },
        );
      }
    }
  }

  /**
   * Reads and parses a JSON manifest file, tracking it as a file dependency
   * so webpack's watcher triggers a rebuild when it changes.
   *
   * @param filePath - The path to the manifest JSON file.
   * @returns The parsed manifest.
   */
  private readManifest(filePath: string): Manifest {
    const manifest = JSON.parse(readFileSync(filePath, 'utf-8'));
    this.watchedFiles.push(filePath);
    return manifest;
  }

  /**
   * Like {@link readManifest}, but returns an empty object if the file doesn't
   * exist or is invalid.
   *
   * @param filePath - The path to the manifest JSON file.
   */
  private tryReadManifest(filePath: string): Partial<Manifest> {
    try {
      return this.readManifest(filePath);
    } catch {
      return {};
    }
  }

  private prepareManifests(compiler: Compiler): void {
    this.watchedFiles = [];

    const root = path.join(compiler.context, '../');
    const manifestOverridesPath = path.join(root, '.manifest-overrides.json');
    if (existsSync(manifestOverridesPath)) {
      this.watchedFiles.push(manifestOverridesPath);
    }

    const metamaskrcPath = path.join(root, '.metamaskrc');
    if (existsSync(metamaskrcPath)) {
      this.watchedFiles.push(metamaskrcPath);
    }

    const metamaskprodrcPath = path.join(root, '.metamaskprodrc');
    if (existsSync(metamaskprodrcPath)) {
      this.watchedFiles.push(metamaskprodrcPath);
    }

    const manifestPath = path.join(
      compiler.context,
      `manifest/v${this.options.manifest_version}`,
    );
    // Load the base manifest
    const basePath = path.join(manifestPath, `_base.json`);
    const baseManifest: Manifest = this.readManifest(basePath);

    const buildTypeManifestPath = path.join(
      compiler.context,
      'build-types',
      this.options.buildType,
      'manifest',
    );
    // Load the build type base manifest for the specific build type if it exists
    const buildTypeBaseManifest = this.tryReadManifest(
      path.join(buildTypeManifestPath, `_base.json`),
    );

    const { transform } = this.options;
    const resources = this.options.web_accessible_resources;
    const baseDescription =
      buildTypeBaseManifest.description ?? baseManifest.description;
    const description = this.options.description
      ? `${baseDescription} – ${this.options.description}`
      : baseDescription;
    const { version } = this.options;

    this.options.browsers.forEach((browser) => {
      let manifest = structuredClone({
        ...baseManifest,
        ...buildTypeBaseManifest,
        description,
        version,
      }) as Manifest;

      if (browser !== 'firefox') {
        // version_name isn't used by FireFox, but is by Chrome, et al.
        manifest.version_name = this.options.versionName;
      }

      manifest = {
        ...manifest,
        // merge browser-specific overrides into the browser manifest if they exist
        ...this.tryReadManifest(path.join(manifestPath, `${browser}.json`)),
        // merge browser-specific build type overrides into the browser manifest if they exist
        ...this.tryReadManifest(
          path.join(buildTypeManifestPath, `${browser}.json`),
        ),
      } as Manifest;

      // merge provided `web_accessible_resources`
      if (resources && resources.length > 0) {
        if (manifest.manifest_version === 3) {
          manifest.web_accessible_resources =
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            manifest.web_accessible_resources || [];
          const war = manifest.web_accessible_resources.find((resource) =>
            resource.matches.includes('<all_urls>'),
          );
          if (war) {
            // merge the resources into the existing <all_urls> resource, ensure uniqueness using `Set`
            war.resources = [...new Set([...war.resources, ...resources])];
          } else {
            // add a new <all_urls> resource
            manifest.web_accessible_resources.push({
              matches: ['<all_urls>'],
              resources: [...resources],
            });
          }
        } else {
          manifest.web_accessible_resources = [
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            ...(manifest.web_accessible_resources || []),
            ...resources,
          ];
        }
      }

      // allow the user to `transform` the manifest
      if (transform) {
        manifest = transform(manifest, browser);
      }

      // Add the manifest file to manifests
      this.manifests.set(browser, manifest);
    });
  }

  private addManifestScript = ({
    compiler,
    entries,
    filename,
    opts,
  }: {
    compiler: Compiler;
    entries: Record<string, EntryDescriptionNormalized>;
    filename: string;
    opts?: EntryDescriptionNormalized;
  }) => {
    if (this.addedScripts.has(filename)) return;
    this.addedScripts.add(filename);
    this.selfContainedScripts.add(filename);
    const filePath = path.resolve(compiler.context, filename);
    entries[filename] = {
      import: [filePath],
      chunkLoading: false,
      filename: extensionToJs(filename),
      ...opts,
    };
  };

  private addHtml = ({
    compiler,
    entries,
    filename,
    opts,
  }: {
    compiler: Compiler;
    entries: Record<string, EntryDescriptionNormalized>;
    filename: string;
    opts?: EntryDescriptionNormalized;
  }) => {
    const parsedFileName = path.parse(filename).name;
    const filePath = path.join(compiler.context, 'html', 'pages', filename);
    entries[parsedFileName] = { import: [filePath], ...opts };
  };

  private collectEntrypoints(
    compiler: Compiler,
    entries: Record<string, EntryDescriptionNormalized>,
  ): void {
    for (const manifest of this.manifests.values()) {
      // collect content_scripts (MV2 + MV3)
      for (const contentScript of manifest.content_scripts ?? []) {
        for (const script of contentScript.js ?? []) {
          this.addManifestScript({ compiler, entries, filename: script });
        }
      }

      if (manifest.manifest_version === 2) {
        // collect MV2 background scripts
        for (const script of manifest.background?.scripts ?? []) {
          this.addManifestScript({ compiler, entries, filename: script });
        }
        // collect MV2 web accessible resources
        for (const resource of manifest.web_accessible_resources ?? []) {
          if (resource.endsWith('.js')) {
            this.addManifestScript({ compiler, entries, filename: resource });
          }
        }
      } else if (manifest.manifest_version === 3) {
        // collect MV3 service worker
        if (manifest.background?.service_worker) {
          this.addManifestScript({
            compiler,
            entries,
            filename: manifest.background.service_worker,
            opts: { chunkLoading: 'import-scripts' },
          });
        }
        // collect MV3 web accessible resources
        for (const resource of manifest.web_accessible_resources ?? []) {
          for (const filename of resource.resources) {
            if (filename.endsWith('.js')) {
              this.addManifestScript({ compiler, entries, filename });
            }
          }
        }
      }
    }

    let htmlFiles: string[] = [];
    try {
      htmlFiles = readdirSync(path.join(compiler.context, 'html', 'pages'));
    } catch {
      // directory doesn't exist, no HTML pages to add
    }

    for (const filename of htmlFiles) {
      // ignore non-htm/html files
      if (/\.html?$/iu.test(filename)) {
        // ignore background.html for MV3 extensions.
        if (
          this.options.manifest_version === 3 &&
          filename === 'background.html'
        ) {
          continue;
        }
        // ignore offscreen.html for MV2 extensions.
        if (
          this.options.manifest_version === 2 &&
          filename === 'offscreen.html'
        ) {
          continue;
        }
        this.addHtml({ compiler, entries, filename });
      }
    }
  }

  private resolveEntrypoints(compilation: Compilation): void {
    // Re-read manifests from disk only if a watched file was modified.
    // `compiler.modifiedFiles` is undefined on the first compilation, and
    // populated on subsequent watch-mode rebuilds. Entrypoint changes still
    // require a restart as they are only collected once in `entryOption`.
    const { modifiedFiles } = compilation.compiler;
    if (
      modifiedFiles &&
      this.watchedFiles.some((watchedFile) => modifiedFiles.has(watchedFile))
    ) {
      this.prepareManifests(compilation.compiler);
    }

    for (const [browser, manifest] of this.manifests) {
      // resolve content_scripts (MV2 + MV3)
      for (const contentScript of manifest.content_scripts ?? []) {
        contentScript.js = contentScript.js?.map((contentScriptPath) => {
          const contentScriptEntrypoint =
            compilation.entrypoints.get(contentScriptPath);
          const contentScriptFile = contentScriptEntrypoint?.getFiles().at(0);
          return contentScriptFile ?? contentScriptPath;
        });
      }

      if (manifest.manifest_version === 2) {
        // resolve MV2 background scripts
        if (manifest.background?.scripts) {
          manifest.background.scripts = manifest.background.scripts.map(
            (scriptPath) => {
              const scriptEntrypoint = compilation.entrypoints.get(scriptPath);
              const scriptFile = scriptEntrypoint?.getFiles().at(0);
              return scriptFile ?? scriptPath;
            },
          );
        }
        // resolve MV2 web accessible resources
        if (manifest.web_accessible_resources) {
          manifest.web_accessible_resources =
            manifest.web_accessible_resources.map((resourcePath) => {
              if (resourcePath.endsWith('.js')) {
                const resourceEntrypoint =
                  compilation.entrypoints.get(resourcePath);
                const resourceFile = resourceEntrypoint?.getFiles().at(0);
                return resourceFile ?? resourcePath;
              }
              return resourcePath;
            });
        }
      } else if (manifest.manifest_version === 3) {
        // resolve MV3 service worker
        if (manifest.background?.service_worker) {
          const serviceWorkerEntrypoint = compilation.entrypoints.get(
            manifest.background.service_worker,
          );
          const serviceWorkerFile = serviceWorkerEntrypoint?.getFiles().at(0);
          if (serviceWorkerFile) {
            manifest.background.service_worker = serviceWorkerFile;
          }
        }
        // resolve MV3 web accessible resources
        if (manifest.web_accessible_resources) {
          for (const resource of manifest.web_accessible_resources) {
            resource.resources = resource.resources.map((resourcePath) => {
              if (resourcePath.endsWith('.js')) {
                const resourceEntrypoint =
                  compilation.entrypoints.get(resourcePath);
                const resourceFile = resourceEntrypoint?.getFiles().at(0);
                return resourceFile ?? resourcePath;
              }
              return resourcePath;
            });
          }
        }
      }

      // cache the resolved manifests as RawSource
      this.manifestSources.set(
        browser,
        new RawSource(JSON.stringify(manifest, null, 2)),
      );
    }
  }

  private hookIntoPipelines(compilation: Compilation): void {
    // Move/rename extension assets before hash optimization to keep hash
    // dependency analysis aligned with final asset names.
    const moveTapOptions = {
      name: NAME,
      stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_HASH - 1,
    };
    // Run zipping after hashing and transfer optimizations, once final asset
    // names/content are settled.
    const zipTapOptions = {
      name: NAME,
      stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
    };

    compilation.hooks.processAssets.tap(moveTapOptions, () => {
      this.resolveEntrypoints(compilation);
      this.moveAssets(
        compilation,
        this.options as ManifestPluginOptions<false>,
      );
    });

    if (this.options.zip) {
      const options = this.options as ManifestPluginOptions<true>;
      compilation.hooks.processAssets.tapPromise(zipTapOptions, async () => {
        await this.zipAssets(compilation, options);
      });
    }
  }
}
