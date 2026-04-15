import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import {
  sources,
  ProgressPlugin,
  type Compilation,
  type Compiler,
  type Asset,
  type EntryOptions,
} from 'webpack';
import { validate } from 'schema-utils';
import {
  noop,
  extensionToJs,
  type Manifest,
  type Browser,
} from '../../helpers';
import { schema } from './schema';
import type { ManifestPluginOptions } from './types';
import { createBrowserZipBuilder, type ZipCompressionOptions } from './zip';

const { CachedSource, RawSource } = sources;

type Assets = Compilation['assets'];

export type EntryDescriptionNormalized = { import?: string[] } & Omit<
  EntryOptions,
  'name'
>;

const NAME = 'ManifestPlugin';
const SOURCEMAPS_DIRECTORY = 'sourcemaps';

/**
 * A webpack plugin that generates extension manifests for browsers and organizes
 * assets into browser-specific directories and optionally zips them.
 *
 */
export class ManifestPlugin<Z extends boolean> {
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

  /**
   * Emits each browser-specific manifest into its final output location.
   *
   * @param compilation - The active compilation.
   * @param browsers - The browsers being built.
   */
  private emitManifestAssets(
    compilation: Compilation,
    browsers: readonly Browser[],
  ): void {
    browsers.forEach((browser) => {
      const manifest = this.manifestSources.get(browser) as sources.RawSource;
      compilation.emitAsset(
        path.posix.join(browser, 'manifest.json'),
        manifest,
        {
          javascriptModule: false,
          contentType: 'application/json',
        },
      );
    });
  }

  /**
   * Zips the assets for each browser into separate zip files and moves all
   * assets into browser-specific directories. Source map assets may be moved to
   * a dedicated `sourcemaps` directory if `devtool` is set to
   * `hidden-source-map` to avoid exposing them in production builds.
   *
   * It uses a single-pass algorithm that iterates through the assets once, adding
   * them to the appropriate zip builders and moving them to the correct
   * location in the browser-specific directories.
   *
   * Note: This method uses `path.posix.join`, for the same reason
   * {@link moveAssets} does.
   *
   * @param compilation - The active compilation.
   * @param assets - The current asset map.
   * @param options - The zip-enabled plugin options.
   */
  private async zipAndMoveAssets(
    compilation: Compilation,
    assets: Assets,
    options: ManifestPluginOptions<true>,
  ): Promise<void> {
    const { browsers, zipOptions } = options;
    const { excludeExtensions, level, outFilePath, mtime } = zipOptions;
    const compressionOptions: ZipCompressionOptions = { level };
    const moveSourceMapsToDedicatedDirectory =
      compilation.options.devtool === 'hidden-source-map';
    const [primaryBrowser, ...additionalBrowsers] = browsers;
    const assetNames = Object.keys(assets);
    const zipEligibleAssetCount = assetNames.filter(
      (assetName) => !excludeExtensions.includes(path.extname(assetName)),
    ).length;

    let filesProcessed = 0;
    const totalWork = browsers.length * (zipEligibleAssetCount + 1);
    const reportProgress =
      ProgressPlugin.getReporter(compilation.compiler) ?? noop;
    const zipBuilders = browsers.map((browser) => {
      const manifest = this.manifestSources.get(browser) as sources.RawSource;
      const onAssetAdded = (assetName: string) => {
        reportProgress(
          0,
          `${++filesProcessed}/${totalWork} assets zipped for ${browser}`,
          assetName,
        );
      };

      return {
        browser,
        builder: createBrowserZipBuilder({
          compressionOptions,
          excludeExtensions,
          manifest,
          mtime,
          onAssetAdded,
        }),
      };
    });

    for (const assetName of assetNames) {
      const assetDetails = compilation.getAsset(assetName) as Readonly<Asset>;
      const extName = path.extname(assetName);
      const isSourceMapAsset =
        moveSourceMapsToDedicatedDirectory && assetName.endsWith('.map');
      const shouldZip = !excludeExtensions.includes(extName);
      const shouldCache =
        shouldZip || (additionalBrowsers.length > 0 && !isSourceMapAsset);
      let { source } = assetDetails;

      if (shouldCache && !(source instanceof CachedSource)) {
        compilation.updateAsset(assetName, (currentSource) => {
          source =
            currentSource instanceof CachedSource
              ? currentSource
              : new CachedSource(currentSource);
          return source;
        });
      }

      if (shouldZip) {
        zipBuilders.forEach(({ builder }) =>
          builder.addAsset(assetName, source),
        );
      }

      if (isSourceMapAsset) {
        compilation.renameAsset(
          assetName,
          path.posix.join(SOURCEMAPS_DIRECTORY, assetName),
        );
        continue;
      }

      const primaryAssetPath = path.posix.join(primaryBrowser, assetName);
      if (assetName !== primaryAssetPath) {
        compilation.renameAsset(assetName, primaryAssetPath);
      }

      additionalBrowsers.forEach((browser) => {
        compilation.emitAsset(
          path.posix.join(browser, assetName),
          source,
          assetDetails.info,
        );
      });
    }

    this.emitManifestAssets(compilation, browsers);

    for (const { browser, builder } of zipBuilders) {
      const data = await builder.finalize();
      const filePath = outFilePath.replaceAll('[browser]', browser);
      compilation.emitAsset(filePath, data, {
        javascriptModule: false,
        compressed: true,
        contentType: 'application/zip',
        development: true,
      });
    }
  }

  /**
   * Moves the assets to the correct browser locations and adds each browser's
   * extension manifest.json file to the list of assets.
   *
   * Note: This method uses `path.posix.join` instead of `path.join` because
   * webpack asset names are expected to use forward slashes. On Windows,
   * `path.join` would produce backslashes, which can cause mismatches with
   * webpack internals that normalize asset names to forward slashes.
   *
   * @param compilation
   * @param assets
   * @param options
   */
  private moveAssets(
    compilation: Compilation,
    assets: Assets,
    options: ManifestPluginOptions<false>,
  ): void {
    const moveSourceMapsToDedicatedDirectory =
      compilation.options.devtool === 'hidden-source-map';
    const { browsers } = options;
    const [primaryBrowser, ...additionalBrowsers] = browsers;

    for (const assetName of Object.keys(assets)) {
      const assetDetails = compilation.getAsset(assetName) as Readonly<Asset>;

      const isSourceMapAsset =
        moveSourceMapsToDedicatedDirectory && assetName.endsWith('.map');
      let { source } = assetDetails;

      if (
        additionalBrowsers.length > 0 &&
        !isSourceMapAsset &&
        !(source instanceof CachedSource)
      ) {
        compilation.updateAsset(assetName, (currentSource) => {
          source =
            currentSource instanceof CachedSource
              ? currentSource
              : new CachedSource(currentSource);
          return source;
        });
      }

      if (isSourceMapAsset) {
        compilation.renameAsset(
          assetName,
          path.posix.join(SOURCEMAPS_DIRECTORY, assetName),
        );
        continue;
      }

      const primaryAssetPath = path.posix.join(primaryBrowser, assetName);
      if (assetName !== primaryAssetPath) {
        compilation.renameAsset(assetName, primaryAssetPath);
      }

      additionalBrowsers.forEach((browser) => {
        compilation.emitAsset(
          path.posix.join(browser, assetName),
          source,
          assetDetails.info,
        );
      });
    }

    this.emitManifestAssets(compilation, browsers);
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

      // if we edit the real `manifest` we change the compilation hash
      const manifestForEmit = this.options.setBuildId
        ? { ...manifest, build_id: compilation.fullHash }
        : manifest;

      // cache the resolved manifests as RawSource
      this.manifestSources.set(
        browser,
        new RawSource(JSON.stringify(manifestForEmit, null, 2)),
      );
    }
  }

  private hookIntoPipelines(compilation: Compilation): void {
    // hook into the processAssets hook to move/zip assets
    const tapOptions = { name: NAME, stage: Infinity };
    if (this.options.zip) {
      const options = this.options as ManifestPluginOptions<true>;
      compilation.hooks.processAssets.tapPromise(
        tapOptions,
        async (assets: Assets) => {
          this.resolveEntrypoints(compilation);
          await this.zipAndMoveAssets(compilation, assets, options);
        },
      );
    } else {
      const options = this.options as ManifestPluginOptions<false>;
      compilation.hooks.processAssets.tap(tapOptions, (assets: Assets) => {
        this.resolveEntrypoints(compilation);
        this.moveAssets(compilation, assets, options);
      });
    }
  }
}
