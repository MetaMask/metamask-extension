import { type WebpackPluginInstance, sources } from 'webpack';
import { extensionToJs, type ManifestV3 } from '../../helpers';

export const replaceSource = (
  source: sources.Source,
  assetName: string,
  searchValue: string,
  replaceValue: string,
) => {
  const sourceString = source.source().toString();
  const newSource = new sources.ReplaceSource(source, assetName);
  let index: number = 0;
  let from: number = 0;
  while (index !== -1) {
    index = sourceString.indexOf(searchValue, from);
    if (index === -1) {
      break;
    }
    newSource.replace(index, index + searchValue.length - 1, replaceValue);
    from = index + searchValue.length;
  }
  return newSource;
};

// The serviceWorkerPlugin is used to inject the list of files to be imported using importScripts in the service worker.
// This is done by replacing the `process.env.FILE_NAMES` string in
// the service worker script with a JSON string containing the list of files.
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
          if (!manifest.background?.service_worker) {
            throw new Error(
              'Manifest V3 requires a background.service_worker entry in the manifest',
            );
          }
          const background = compilation.entrypoints.get('background');
          if (!background) {
            throw new Error(
              'Manifest V3 requires an entrypoint named "background" which will be loaded by the service worker',
            );
          }
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
