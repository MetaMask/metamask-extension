import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, parse } from 'node:path/posix';
import {
  sources,
  ProgressPlugin,
  type Compilation,
  type Compiler,
  type Asset,
  type EntryObject,
} from 'webpack';
import { validate } from 'schema-utils';
import {
  type DeflateOptions,
  Zip,
  AsyncZipDeflate,
  ZipPassThrough,
} from 'fflate';
import { noop, type Manifest, Browser } from '../../helpers';
import { schema } from './schema';
import type { ManifestPluginOptions } from './types';

const { RawSource, ConcatSource } = sources;

type Assets = Compilation['assets'];
type EntryDescription = Exclude<EntryObject[string], string | string[]>;

const NAME = 'ManifestPlugin';
const BROWSER_TEMPLATE_RE = /\[browser\]/gu;

/**
 * @param filename
 * @returns filename with .js extension (.ts | .tsx | .mjs -> .js)
 */
const extensionToJs = (filename: string) =>
  filename.replace(/\.(ts|tsx|mjs)$/u, '.js');

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
 * A webpack plugin that generates extension manifests for browsers, collects
 * entry points from the fully merged manifest, organizes assets into
 * browser-specific directories, and optionally zips them.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

  manifests: Map<Browser, sources.Source> = new Map();

  /**
   * Webpack entry points derived from the fully merged per-browser manifests.
   */
  readonly entry: EntryObject;

  /**
   * Returns `true` if the given chunk can be split into shared chunks.
   * Manifest scripts and hardcoded self-contained scripts cannot be chunked.
   */
  readonly canBeChunked: (chunk: { name?: string | null }) => boolean;

  private mergedManifests: Map<Browser, Manifest>;

  private manifestScriptEntries: Set<string>;

  constructor(options: ManifestPluginOptions<Z>) {
    validate(schema, options, { name: NAME });
    this.options = options;
    this.manifests = new Map();

    this.mergedManifests = this.buildMergedManifests();
    const { entry, canBeChunked, manifestScripts } = this.collectEntries();
    this.entry = entry;
    this.canBeChunked = canBeChunked;
    this.manifestScriptEntries = manifestScripts;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(NAME, this.hookIntoPipelines.bind(this));
  }

  /**
   * Builds the fully merged manifest for each browser. This performs the full
   * merge pipeline: base + build-type base + options + browser-specific +
   * build-type browser-specific + web_accessible_resources + transform.
   *
   * Called once in the constructor; results are cached and cloned per
   * compilation in `prepareManifests`.
   */
  private buildMergedManifests(): Map<Browser, Manifest> {
    const { appRoot } = this.options;
    const manifestPath = join(
      appRoot,
      `manifest/v${this.options.manifest_version}`,
    );
    // Load the base manifest
    const basePath = join(manifestPath, `_base.json`);
    const baseManifest: Manifest = JSON.parse(readFileSync(basePath, 'utf-8'));

    const buildTypeManifestPath = join(
      appRoot,
      'build-types',
      this.options.buildType,
      'manifest',
    );
    // Load the build type base manifest if it exists for the specific build type
    const buildTypeBasePath = join(buildTypeManifestPath, `_base.json`);
    let buildTypeBaseManifest: Partial<Manifest> = {};
    try {
      buildTypeBaseManifest = JSON.parse(
        readFileSync(buildTypeBasePath, 'utf-8'),
      );
    } catch {
      // File doesn't exist or is invalid, use empty object
    }

    const { transform } = this.options;
    const resources = this.options.web_accessible_resources;
    const baseDescription =
      buildTypeBaseManifest.description ?? baseManifest.description;
    const description = this.options.description
      ? `${baseDescription} – ${this.options.description}`
      : baseDescription;
    const { version } = this.options;

    const result = new Map<Browser, Manifest>();

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

      const browserManifestPath = join(manifestPath, `${browser}.json`);
      try {
        // merge browser-specific overrides into the browser manifest
        manifest = {
          ...manifest,
          ...JSON.parse(readFileSync(browserManifestPath, 'utf-8')),
        };
      } catch {
        // File doesn't exist or is invalid, skip merging
      }

      const buildTypeBrowserManifestPath = join(
        buildTypeManifestPath,
        `${browser}.json`,
      );
      try {
        // merge browser-specific build type overrides into the browser manifest
        manifest = {
          ...manifest,
          ...JSON.parse(readFileSync(buildTypeBrowserManifestPath, 'utf-8')),
        };
      } catch {
        // File doesn't exist or is invalid, skip merging
      }

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

      result.set(browser, manifest);
    });

    return result;
  }

  /**
   * Collects webpack entry points from the fully merged per-browser manifests.
   * Takes the union across all browsers so that every script referenced by any
   * browser is compiled.
   */
  private collectEntries(): {
    entry: EntryObject;
    canBeChunked: (chunk: { name?: string | null }) => boolean;
    manifestScripts: Set<string>;
  } {
    const { appRoot } = this.options;
    const htmlPages = join(appRoot, 'html', 'pages');
    const entry: EntryObject = {};
    const selfContainedScripts: Set<string> = new Set([
      'snow.prod',
      'use-snow',
      'bootstrap',
    ]);

    function addManifestScript(
      filename: string,
      opts?: Partial<EntryDescription>,
    ) {
      if (selfContainedScripts.has(filename)) {
        return; // already added
      }
      selfContainedScripts.add(filename);
      const jsName = extensionToJs(filename);
      const { dir, name } = parse(jsName);
      entry[filename] = {
        chunkLoading: false,
        filename: join(dir, `${name}.[contenthash].js`),
        import: join(appRoot, filename),
        ...opts,
      };
    }

    function addHtml(filename: string) {
      const parsedFileName = parse(filename).name;
      entry[parsedFileName] = join(htmlPages, filename);
    }

    // Iterate over each browser's merged manifest and collect entries (union)
    for (const manifest of this.mergedManifests.values()) {
      // add content_scripts to entries
      for (const contentScript of manifest.content_scripts ?? []) {
        for (const script of contentScript.js ?? []) {
          addManifestScript(script);
        }
      }

      // Handle background
      if (manifest.background?.page) {
        const parsedFileName = parse(manifest.background.page).name;
        if (!entry[parsedFileName]) {
          addHtml(manifest.background.page);
        }
      }
      if (manifest.background?.service_worker) {
        addManifestScript(manifest.background.service_worker, {
          chunkLoading: 'import-scripts',
        });
      }
      for (const script of manifest.background?.scripts ?? []) {
        addManifestScript(script);
      }

      // Handle web_accessible_resources (may be v2 string[] or v3 object[])
      for (const resource of manifest.web_accessible_resources ?? []) {
        if (typeof resource === 'string') {
          // MV2 format
          if (resource.endsWith('.js')) {
            addManifestScript(resource);
          }
        } else {
          // MV3 format
          for (const filename of resource.resources) {
            if (filename.endsWith('.js')) {
              addManifestScript(filename);
            }
          }
        }
      }
    }

    // Scan html/pages/ for HTML entries (browser-independent)
    try {
      for (const filename of readdirSync(htmlPages)) {
        if (/\.html?$/iu.test(filename)) {
          if (filename === 'background.html') {
            continue;
          }
          // ignore offscreen.html for MV2 extensions
          if (
            this.options.manifest_version === 2 &&
            filename === 'offscreen.html'
          ) {
            continue;
          }
          addHtml(filename);
        }
      }
    } catch {
      // html/pages/ directory doesn't exist, skip
    }

    function canBeChunked({ name }: { name?: string | null }): boolean {
      return !name || !selfContainedScripts.has(name);
    }

    return { entry, canBeChunked, manifestScripts: selfContainedScripts };
  }

  private async zipAssets(
    compilation: Compilation,
    assets: Assets, // an object of asset names to assets
    options: ManifestPluginOptions<true>,
  ): Promise<void> {
    // TODO(perf): this zips (and compresses) every file individually for each
    // browser. Can we share the compression and crc steps to save time?
    const { browsers, zipOptions } = options;
    const { excludeExtensions, level, outFilePath, mtime } = zipOptions;
    const compressionOptions: DeflateOptions = { level };
    const assetsArray = Object.entries(assets);

    let filesProcessed = 0;
    const numAssetsPerBrowser = assetsArray.length + 1;
    const totalWork = numAssetsPerBrowser * browsers.length; // +1 for each browser's manifest.json
    const reportProgress =
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      ProgressPlugin.getReporter(compilation.compiler) || noop;
    // TODO(perf): run this in parallel. If you try without carefully optimizing the
    // process will run out of memory pretty quickly, and crash. Fun!
    for (const browser of browsers) {
      const manifest = this.manifests.get(browser) as sources.Source;
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

        for (const [assetName, asset] of assetsArray) {
          if (errored) return;

          const extName = extname(assetName);
          if (excludeExtensions.includes(extName)) continue;

          addAssetToZip(
            asset.buffer(),
            assetName,
            ManifestPlugin.compressibleFileTypes.has(extName),
            compressionOptions,
            mtime,
            zip,
          );
          reportProgress(
            0,
            `${++filesProcessed}/${totalWork} assets zipped for ${browser}`,
            assetName,
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
   * extension manifest.json file to the list of assets.
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
    // we need to wait to delete assets until after we've zipped them all
    const assetDeletions = new Set<string>();
    const { browsers } = options;
    const assetEntries = Object.entries(assets);
    browsers.forEach((browser) => {
      const manifest = this.manifests.get(browser) as sources.Source;
      compilation.emitAsset(join(browser, 'manifest.json'), manifest, {
        javascriptModule: false,
        contentType: 'application/json',
      });
      for (const [name, asset] of assetEntries) {
        // move the assets to their final browser-relative locations
        const assetDetails = compilation.getAsset(name) as Readonly<Asset>;
        compilation.emitAsset(join(browser, name), asset, assetDetails.info);
        assetDeletions.add(name);
      }
    });
    // delete the assets after we've zipped them all
    assetDeletions.forEach((assetName) => compilation.deleteAsset(assetName));
  }

  /**
   * Resolves an entry script name to its actual output filename using the
   * compilation's entrypoints map.
   */
  private resolveEntryFile(
    compilation: Compilation,
    scriptName: string,
  ): string {
    const ep = compilation.entrypoints.get(scriptName);
    if (ep) {
      const jsFile = ep.getFiles().find((f: string) => f.endsWith('.js'));
      if (jsFile) return jsFile;
    }
    return scriptName;
  }

  /**
   * Prepares final manifests for each browser by cloning the cached merged
   * manifests and resolving all script filenames from compilation entrypoints.
   */
  private prepareManifests(compilation: Compilation): void {
    this.options.browsers.forEach((browser) => {
      const manifest = structuredClone(
        this.mergedManifests.get(browser),
      ) as Manifest;

      // Resolve content_scripts filenames
      for (const contentScript of manifest.content_scripts ?? []) {
        if (contentScript.js) {
          contentScript.js = contentScript.js.map((script: string) =>
            this.resolveEntryFile(compilation, script),
          );
        }
      }

      if (manifest.manifest_version === 2) {
        // Resolve MV2 background.scripts filenames
        if (manifest.background?.scripts) {
          manifest.background.scripts = manifest.background.scripts.map(
            (script: string) => this.resolveEntryFile(compilation, script),
          );
        }
        // Resolve MV2 web_accessible_resources JS filenames
        if (manifest.web_accessible_resources) {
          manifest.web_accessible_resources =
            manifest.web_accessible_resources.map((resource: string) =>
              resource.endsWith('.js')
                ? this.resolveEntryFile(compilation, resource)
                : resource,
            );
        }
      } else if (manifest.manifest_version === 3) {
        // Resolve MV3 service worker filename
        if (manifest.background?.service_worker) {
          manifest.background.service_worker = this.resolveEntryFile(
            compilation,
            manifest.background.service_worker,
          );
        }
        // Resolve MV3 web_accessible_resources JS filenames
        if (manifest.web_accessible_resources) {
          for (const resource of manifest.web_accessible_resources) {
            resource.resources = resource.resources.map((filename: string) =>
              filename.endsWith('.js')
                ? this.resolveEntryFile(compilation, filename)
                : filename,
            );
          }
        }
      }

      // Add source map files to web_accessible_resources if devtool is source-map
      if (compilation.options.devtool === 'source-map') {
        const sourceMapFiles: string[] = [];
        for (const contentScript of manifest.content_scripts ?? []) {
          for (const script of contentScript.js ?? []) {
            sourceMapFiles.push(`${script}.map`);
          }
        }
        if (sourceMapFiles.length > 0) {
          if (manifest.manifest_version === 3) {
            manifest.web_accessible_resources =
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              manifest.web_accessible_resources || [];
            const war = manifest.web_accessible_resources.find((resource) =>
              resource.matches.includes('<all_urls>'),
            );
            if (war) {
              war.resources = [
                ...new Set([...war.resources, ...sourceMapFiles]),
              ];
            } else {
              manifest.web_accessible_resources.push({
                matches: ['<all_urls>'],
                resources: sourceMapFiles,
              });
            }
          } else {
            manifest.web_accessible_resources = [
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              ...(manifest.web_accessible_resources || []),
              ...sourceMapFiles,
            ];
          }
        }
      }

      // Add the manifest file to the assets
      const source = new RawSource(JSON.stringify(manifest, null, 2));
      this.manifests.set(browser, source);
    });
  }

  private hookIntoPipelines(compilation: Compilation): void {
    // hook into the processAssets hook to move/zip assets
    const tapOptions = { name: NAME, stage: Infinity };
    if (this.options.zip) {
      const options = this.options as ManifestPluginOptions<true>;
      compilation.hooks.processAssets.tapPromise(
        tapOptions,
        async (assets: Assets) => {
          this.prepareManifests(compilation);
          await this.zipAssets(compilation, assets, options);
          this.moveAssets(
            compilation,
            assets,
            this.options as ManifestPluginOptions<false>,
          );
        },
      );
    } else {
      const options = this.options as ManifestPluginOptions<false>;
      compilation.hooks.processAssets.tap(tapOptions, (assets: Assets) => {
        this.prepareManifests(compilation);
        this.moveAssets(compilation, assets, options);
      });
    }
  }
}
