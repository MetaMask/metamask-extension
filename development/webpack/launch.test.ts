/** @jest-environment node */

import { ChildProcess, spawn } from 'node:child_process';
import parser from 'yargs-parser';
import { build } from './build';

jest.mock('node:child_process', () => ({
  ...jest.requireActual<typeof import('node:child_process')>(
    'node:child_process',
  ),
  spawn: jest.fn(),
}));
jest.mock('node:tty', () => ({ isatty: () => false }));
jest.mock('@lydell/node-pty', () => ({ open: jest.fn() }));
jest.mock('yargs-parser', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./build', () => ({ build: jest.fn() }));

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('webpack launcher', () => {
  const originalExitCode = process.exitCode;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    jest.mocked(build).mockResolvedValue(undefined);
  });
  afterEach(() => {
    process.exitCode = originalExitCode;
    jest.restoreAllMocks();
  });

  it.each([{ cache: false }, { help: true }, { watch: true }])(
    'starts direct builds for %j',
    async (args) => {
      jest.mocked(parser).mockReturnValue(args);
      jest.isolateModules(() => {
        require('./launch');
      });
      await settle();
      expect(build).toHaveBeenCalledTimes(1);
      expect(spawn).not.toHaveBeenCalled();
    },
  );

  it('forks cached builds instead of loading the build in the parent', async () => {
    jest.mocked(parser).mockReturnValue({});
    jest.mocked(spawn).mockReturnValue(new ChildProcess());
    jest.isolateModules(() => {
      require('./launch');
    });
    await settle();
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(build).not.toHaveBeenCalled();
  });

  it('reports rejected build initialization and exits unsuccessfully', async () => {
    const error = new Error('initialization rejected');
    jest.mocked(parser).mockReturnValue({ cache: false });
    jest.mocked(build).mockRejectedValue(error);
    jest.isolateModules(() => {
      require('./launch');
    });
    await settle();
    expect(console.error).toHaveBeenCalledWith(error);
    expect(process.exitCode).toBe(1);
  });
});
