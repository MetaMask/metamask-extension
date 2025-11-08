import { type WebpackPluginInstance } from 'webpack';
import { extensionToJs, replaceSource, type ManifestV3 } from '../../helpers';

/**
 * The serviceWorkerPlugin is used to inject the list of files to be imported using importScripts in the service worker.
 * This is done by replacing the `process.env.FILE_NAMES` string in
 * the service worker script with a JSON string containing the list of files.
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
