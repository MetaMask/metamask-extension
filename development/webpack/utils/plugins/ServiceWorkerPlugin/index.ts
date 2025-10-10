import { type WebpackPluginInstance, sources } from 'webpack';

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
export const serviceWorkerPlugin: WebpackPluginInstance = {
  apply: (compiler) => {
    compiler.hooks.thisCompilation.tap('ServiceWorkerPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'ServiceWorkerPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          const serviceWorkerAssets: string[] = [];
          const background = compilation.entrypoints.get('background');
          const backgroundChunks = background?.chunks ?? [];
          for (const chunk of backgroundChunks) {
            for (const file of chunk.files) {
              serviceWorkerAssets.push(`../${file}`);
            }
          }
          const filenames = serviceWorkerAssets.join(',');
          const assetName = 'app-init.js';
          const searchValue = 'process.env.FILE_NAMES';
          const replaceValue = JSON.stringify(filenames);
          compilation.updateAsset(assetName, (source) =>
            replaceSource(source, assetName, searchValue, replaceValue),
          );
        },
      );
    });
  },
};
