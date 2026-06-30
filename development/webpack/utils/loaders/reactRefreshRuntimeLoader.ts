import { dirname } from 'node:path';
import type { LoaderContext } from 'webpack';

const REACT_REFRESH_ENTRY_PATH =
  require.resolve('@pmmmwh/react-refresh-webpack-plugin/client/ReactRefreshEntry');
const REACT_REFRESH_RUNTIME_CLIENT_PATH =
  require.resolve('../dev-server/react-refresh-runtime-client');

export default function reactRefreshRuntimeLoader(
  this: LoaderContext<Record<string, never>>,
  source: string,
): string {
  this.cacheable();

  const resourceDirectory = dirname(this.resourcePath);
  const imports = [
    REACT_REFRESH_ENTRY_PATH,
    REACT_REFRESH_RUNTIME_CLIENT_PATH,
  ].map((entryPath) => {
    const request = this.utils.contextify(resourceDirectory, entryPath);
    return `import ${JSON.stringify(request)};`;
  });

  return `${imports.join('\n')}\n${source}`;
}
