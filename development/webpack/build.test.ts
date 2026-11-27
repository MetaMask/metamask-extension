/** @jest-environment node */

import { webpack } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import createConfig from './webpack.config';
import { build } from './build';

jest.mock('webpack', () => {
  const factory = jest.fn();
  return { __esModule: true, webpack: factory, default: { webpack: factory } };
});
jest.mock('webpack-dev-server', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./webpack.config', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./utils/helpers', () => ({
  logStats: jest.fn(),
  noop: () => undefined,
  ignoreCacheShutdownSignal: jest.fn(() => () => undefined),
}));
jest.mock('./utils/dev-server', () => ({
  logWatchBuildStats: jest.fn(),
  suppressDevServerInfoLogs: jest.fn(),
}));
jest.mock('browserslist/node', () => {
  const value = { getStat: jest.fn() };
  return { __esModule: true, default: value, getStat: value.getStat };
});

type Config = Awaited<ReturnType<typeof createConfig>>;

describe('build', () => {
  const compiler = { run: jest.fn(), close: jest.fn() };
  const start = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    jest
      .mocked(webpack)
      .mockReturnValue(compiler as unknown as ReturnType<typeof webpack>);
    start.mockResolvedValue(undefined);
    jest
      .mocked(WebpackDevServer)
      .mockImplementation(
        () => ({ start, options: {} }) as unknown as WebpackDevServer,
      );
  });
  afterEach(() => jest.restoreAllMocks());

  it('waits for configuration before starting webpack', async () => {
    let resolveConfig!: (config: Config) => void;
    const configuration = new Promise<Config>((resolve) => {
      resolveConfig = resolve;
    });
    jest.mocked(createConfig).mockReturnValue(configuration);
    const pending = build();
    expect(webpack).not.toHaveBeenCalled();
    resolveConfig({
      mode: 'development',
      watch: false,
      cache: { type: 'memory' },
    } as Config);
    await pending;
    expect(webpack).toHaveBeenCalledWith({
      mode: 'development',
      cache: { type: 'memory' },
    });
    expect(compiler.run).toHaveBeenCalledWith(expect.any(Function));
  });

  it('loads and starts the watch server after configuration resolves', async () => {
    const devServer = { host: 'localhost', port: 9999 };
    jest.mocked(createConfig).mockResolvedValue({
      mode: 'development',
      watch: true,
      devServer,
    } as Config);
    await build();
    expect(WebpackDevServer).toHaveBeenCalledWith(devServer, compiler);
    expect(start).toHaveBeenCalledTimes(1);
    expect(compiler.run).not.toHaveBeenCalled();
  });

  it('propagates initialization failures without starting webpack', async () => {
    const error = new Error('configuration failed');
    jest.mocked(createConfig).mockRejectedValue(error);
    await expect(build()).rejects.toThrow(error);
    expect(webpack).not.toHaveBeenCalled();
  });
});
