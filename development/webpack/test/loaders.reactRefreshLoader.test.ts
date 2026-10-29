import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import type { LoaderContext } from 'webpack';
import reactRefreshLoader, {
  type ReactRefreshLoaderOptions,
} from '../utils/loaders/reactRefreshLoader';

describe('reactRefreshLoader', () => {
  it('prepends the React Refresh runtime and UI client imports', () => {
    const clientRequest =
      '/repo/development/webpack/utils/dev-server/ui-client.ts?url=ws%3A%2F%2Flocalhost%3A12345%2Fws';
    const resourceDirectory = '/repo/app/scripts/load';
    const contextify = mock.fn(
      (context: string, request: string) => `${context}::${request}`,
    );
    const context = {
      resourcePath: `${resourceDirectory}/ui.ts`,
      getOptions: () => ({ clientRequest }),
      utils: { contextify },
    } as unknown as LoaderContext<ReactRefreshLoaderOptions>;
    const reactRefreshEntryPath =
      require.resolve('@pmmmwh/react-refresh-webpack-plugin/client/ReactRefreshEntry');

    const result = reactRefreshLoader.call(context, 'bootstrapUi();');

    assert.deepStrictEqual(
      contextify.mock.calls.map(({ arguments: args }) => args),
      [
        [resourceDirectory, reactRefreshEntryPath],
        [resourceDirectory, clientRequest],
      ],
    );
    assert.strictEqual(
      result,
      `import "${resourceDirectory}::${reactRefreshEntryPath}";\nimport "${resourceDirectory}::${clientRequest}";\nbootstrapUi();`,
    );
  });
});
