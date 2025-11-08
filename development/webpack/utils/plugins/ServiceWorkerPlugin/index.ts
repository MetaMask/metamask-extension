import { type WebpackPluginInstance } from 'webpack';
import { extensionToJs, replaceSource, type ManifestV3 } from '../../helpers';

/**
 * A custom Webpack plugin that modifies the service worker file in a MV3 extension build.
 *
 * This plugin locates the background service worker defined in the extension manifest,
 * retrieves its corresponding build output files, and injects their names into the
 * compiled service worker code by replacing a placeholder string (`process.env.FILE_NAMES`)
 * with the actual file names.
 *
 * @param manifest - The extension's manifest object, containing metadata about the background service worker.
 * @returns A Webpack plugin instance that performs the replacement during the `processAssets` compilation stage.
 */
export const serviceWorkerPlugin = (
  manifest: ManifestV3,
): WebpackPluginInstance => ({
  apply: (compiler) => {
    compiler.hooks.thisCompilation.tap('ServiceWorkerPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'ServiceWorkerPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          if (!manifest.background?.service_worker) return;
          const background = compilation.entrypoints.get('background');
          if (!background) return;
          const backgroundFiles = [...background.getEntrypointChunk().files];
          const backgroundFileNames = backgroundFiles.join(',');
          const assetName = extensionToJs(manifest.background.service_worker);
          const searchValue = 'process.env.FILE_NAMES';
          const replaceValue = JSON.stringify(backgroundFileNames);
          compilation.updateAsset(assetName, (source) =>
            replaceSource(source, assetName, searchValue, replaceValue),
          );
        },
      );
    });
  },
});
