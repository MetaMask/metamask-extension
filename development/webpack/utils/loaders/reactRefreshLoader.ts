import { dirname } from 'node:path';
import type { LoaderContext } from 'webpack';

export type ReactRefreshLoaderOptions = {
  clientRequest: string;
};

const REACT_REFRESH_ENTRY_PATH =
  require.resolve('@pmmmwh/react-refresh-webpack-plugin/client/ReactRefreshEntry');

export default function reactRefreshLoader(
  this: LoaderContext<ReactRefreshLoaderOptions>,
  source: string,
): string {
  const { clientRequest } = this.getOptions();
  const resourceDirectory = dirname(this.resourcePath);
  const imports = [REACT_REFRESH_ENTRY_PATH, clientRequest].map(
    (moduleRequest) => {
      const request = this.utils.contextify(resourceDirectory, moduleRequest);
      return `import ${JSON.stringify(request)};`;
    },
  );

  return `${imports.join('\n')}\n${source}`;
}
