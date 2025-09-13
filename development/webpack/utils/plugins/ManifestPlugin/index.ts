import { extname, join } from 'node:path/posix';
import { readFileSync } from 'node:fs';
import {
  sources,
  ProgressPlugin,
  type Compilation,
  type Compiler,
  type Asset,
} from 'webpack';
import { validate } from 'schema-utils';
import {
  type DeflateOptions,
  Zip,
  AsyncZipDeflate,
  ZipPassThrough,
} from 'fflate';
import {
  noop,
  type Manifest,
  Browser,
  browserifyOnlyScripts,
} from '../../helpers';
import { schema } from './schema';
import type { ManifestPluginOptions } from './types';

const { RawSource, ConcatSource } = sources;

type Assets = Compilation['assets'];

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
 * TODO: it'd be great if the logic to find entry points was also in this plugin
 * instead of in helpers.ts. Moving that here would allow us to utilize the
 * this.options.transform function to modify the manifest before collecting the
 * entry points.
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

  constructor(options: ManifestPluginOptions<Z>) {
    validate(schema, options, { name: NAME });
    this.options = options;
    this.manifests = new Map();
  }

  apply(compiler: Compiler) {
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

  private prepareManifests(compilation: Compilation): void {
    const context = compilation.options.context as string;
    const manifestPath = join(
      context,
      `manifest/v${this.options.manifest_version}`,
    );
    // Load the base manifest
    const basePath = join(manifestPath, `_base.json`);
    const baseManifest: Manifest = JSON.parse(readFileSync(basePath, 'utf8'));

    const { transform } = this.options;
    const resources = this.options.web_accessible_resources;
    const description = this.options.description
      ? `${baseManifest.description} – ${this.options.description}`
      : baseManifest.description;
    const { version } = this.options;

    // browserifyOnlyScripts are only relevant for the browserify build
    // so we need to remove them from the manifest when building with webpack
    baseManifest.content_scripts = baseManifest.content_scripts?.map(
      (script) => {
        // Check to make sure the browserifyOnlyScripts are actually in the manifest
        if (script.run_at === 'document_start') {
          for (const browserifyOnlyScript of browserifyOnlyScripts) {
            if (!script.js?.includes(browserifyOnlyScript)) {
              throw new Error(
                `Congrats on your build failure! We expected '${browserifyOnlyScript}' to be in the manifest, but it was not found. This is a good thing. You should update ${__filename} to update or remove this check.`,
              );
            }
          }
        }
        return {
          ...script,
          js: script.js?.filter(
            (filename) => !browserifyOnlyScripts.includes(filename),
          ),
        };
      },
    );

    this.options.browsers.forEach((browser) => {
      let manifest: Manifest = { ...baseManifest, description, version };

      if (browser !== 'firefox') {
        // version_name isn't used by FireFox, but is by Chrome, et al.
        manifest.version_name = this.options.versionName;
      }

      try {
        const browserManifestPath = join(manifestPath, `${browser}.json`);
        // merge browser-specific overrides into the browser manifest
        manifest = {
          ...manifest,
          ...require(browserManifestPath),
        };
      } catch {
        // ignore if the file doesn't exist, as some browsers might not need overrides
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

      // allow the user to `transform` the manifest. Use a copy of the manifest
      // so modifications for one browser don't affect other browsers.
      if (transform) {
        manifest = transform?.(JSON.parse(JSON.stringify(manifest)), browser);
      }

      // Add the manifest file to the assets
      const source = new RawSource(JSON.stringify(manifest, null, 2));
      this.manifests.set(browser, source);
    });
  }

  private hookIntoPipelines(compilation: Compilation): void {
    // prepare manifests early so we can catch errors early instead of waiting
    // until the end of the compilation.
    this.prepareManifests(compilation);

    // TODO: MV3 needs to be handled differently. Specifically, it needs to
    // load the files it needs via a function call to `importScripts`, plus some
    // other shenanigans.

    // hook into the processAssets hook to move/zip assets
    const tapOptions = {
      name: NAME,
      stage: Infinity,
    };
    if (this.options.zip) {
      const options = this.options as ManifestPluginOptions<true>;
      compilation.hooks.processAssets.tapPromise(
        tapOptions,
        async (assets: Assets) => {
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
        this.moveAssets(compilation, assets, options);
      });
    }
  }
}
