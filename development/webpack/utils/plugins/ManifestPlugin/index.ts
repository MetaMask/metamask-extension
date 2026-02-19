import { readFileSync, readdirSync } from 'node:fs';
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
  type DeflateOptions,
  Zip,
  AsyncZipDeflate,
  ZipPassThrough,
} from 'fflate';
import { noop, extensionToJs, type Manifest, Browser } from '../../helpers';
import { schema } from './schema';
import type { ManifestPluginOptions } from './types';

const { RawSource, ConcatSource } = sources;

type Assets = Compilation['assets'];

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

  manifests: Map<Browser, Manifest> = new Map();

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
    this.manifests = new Map();
  }

  apply(compiler: Compiler) {
    compiler.hooks.entryOption.tap(NAME, (_context, entries) => {
      this.prepareManifests(compiler);
      this.collectEntrypoints(
        compiler,
        entries as Record<string, EntryDescriptionNormalized>,
      );
    });
    compiler.hooks.compilation.tap(NAME, this.hookIntoPipelines.bind(this));
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
      const manifest = new RawSource(
        JSON.stringify(this.manifests.get(browser), null, 2),
      );
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

          const extName = path.extname(assetName);
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
      const manifest = new RawSource(
        JSON.stringify(this.manifests.get(browser), null, 2),
      );
      compilation.emitAsset(path.join(browser, 'manifest.json'), manifest, {
        javascriptModule: false,
        contentType: 'application/json',
      });
      for (const [name, asset] of assetEntries) {
        // move the assets to their final browser-relative locations
        const assetDetails = compilation.getAsset(name) as Readonly<Asset>;
        compilation.emitAsset(
          path.join(browser, name),
          asset,
          assetDetails.info,
        );
        assetDeletions.add(name);
      }
    });
    // delete the assets after we've zipped them all
    assetDeletions.forEach((assetName) => compilation.deleteAsset(assetName));
  }

  private prepareManifests(compiler: Compiler): void {
    const manifestPath = path.join(
      compiler.context,
      `manifest/v${this.options.manifest_version}`,
    );
    // Load the base manifest
    const basePath = path.join(manifestPath, `_base.json`);
    const baseManifest: Manifest = JSON.parse(readFileSync(basePath, 'utf-8'));

    const buildTypeManifestPath = path.join(
      compiler.context,
      'build-types',
      this.options.buildType,
      'manifest',
    );
    // Load the build type base manifest if it exists for the specific build type
    const buildTypeBasePath = path.join(buildTypeManifestPath, `_base.json`);
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

      const browserManifestPath = path.join(manifestPath, `${browser}.json`);
      try {
        // merge browser-specific overrides into the browser manifest
        manifest = {
          ...manifest,
          ...JSON.parse(readFileSync(browserManifestPath, 'utf-8')),
        };
      } catch {
        // File doesn't exist or is invalid, skip merging
      }

      const buildTypeBrowserManifestPath = path.join(
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
    for (const manifest of this.manifests.values()) {
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
        this.resolveEntrypoints(compilation);
        this.moveAssets(compilation, assets, options);
      });
    }
  }
}
