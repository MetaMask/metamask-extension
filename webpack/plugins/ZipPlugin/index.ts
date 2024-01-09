import path from 'node:path';
import { sources, Compiler, Compilation } from 'webpack';
import { validate } from 'schema-utils';
import { Zip, ZipPassThrough, AsyncZipDeflate, DeflateOptions } from 'fflate';
import { schema } from './schema';
import { ZipPluginOptions } from './types';

const { RawSource, ConcatSource, } = sources;

const NAME = "ZipPlugin";

export class ZipPlugin {
  /**
   * File types that can be compressed well using DEFLATE compression
   */
  static compressibleFileTypes = [
    ".js",
    ".mjs",
    ".cjs",
    ".css",
    ".csv",
    ".wav",
    ".bmp",
    ".log",
    ".html",
    ".json",
    ".svg",
    ".xml",
    ".txt",
    ".md",
    ".map",
    ".wasm"
  ]
  options: ZipPluginOptions

  constructor(options: Partial<ZipPluginOptions> = {}) {
    validate(schema, options, { name: NAME });

    this.options = { ...options } as any; // we'll fill in any missing bits

    this.options.mtime ??= Date.now();
    this.options.level ??= 9;
    this.options.excludeExtensions ??= [];
    this.options.outFilePath ??= 'out.zip';
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(NAME, this.hookIntoAssetPipeline.bind(this));
  }

  private hookIntoAssetPipeline(compilation: Compilation) {
    const options = {
      name: NAME,
      stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER
    }
    compilation.hooks.processAssets.tapPromise(options, this.zipAssets.bind(this, compilation));
  }

  /**
   * Puts all assets into a zip file
   * @param compilation
   * @param assets
   * @returns
   */
  private async zipAssets(compilation: Compilation, assets: Compilation['assets']): Promise<void> {
    return new Promise((resolve, reject) => {
      let errored = false;
      const zip = new Zip();
      const source = new ConcatSource();
      zip.ondata = (err, dat, final) => {
        if (err) {
          errored = true;
          reject(err);
          return;
        }
        source.add(new RawSource(Buffer.from(dat)));
        if (final) {
          compilation.emitAsset(this.options.outFilePath, source);
          resolve();
        }
      };

      const mtime = this.options.mtime;
      const compressionOptions: DeflateOptions = {
        level: this.options.level,
      };

      for (const assetName in assets) {
        // there was an error, stop processing now.
        if (errored) return;

        if (assets.hasOwnProperty(assetName)) {
          const extName = path.extname(assetName)

          if (this.options.excludeExtensions.includes(extName)) {
            // skip this file
            continue;
          }

          const asset = assets[assetName];

          let zipFile: ZipPassThrough | AsyncZipDeflate;
          if (ZipPlugin.compressibleFileTypes.includes(path.extname(assetName))) {
            zipFile = new AsyncZipDeflate(assetName, compressionOptions);
          } else {
            zipFile = new ZipPassThrough(assetName);
          }
          zipFile.mtime = mtime;
          zip.add(zipFile);
          // use a copy of the Buffer, as Zip will consume it and it will be empty
          zipFile.push(Buffer.from(asset.buffer()), true);

          compilation.deleteAsset(assetName);
        }
      }

      zip.end();
    });
  }
}
