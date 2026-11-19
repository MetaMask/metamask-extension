/** @jest-environment node */

import { build } from './build';

jest.mock('./build', () => ({ build: jest.fn() }));

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('forked webpack entrypoint', () => {
  const originalPpid = process.env.PPID;
  const originalExitCode = process.exitCode;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    process.env.PPID = String(process.ppid);
    jest.mocked(build).mockResolvedValue(undefined);
  });
  afterEach(() => {
    if (originalPpid === undefined) delete process.env.PPID;
    else process.env.PPID = originalPpid;
    process.exitCode = originalExitCode;
    jest.restoreAllMocks();
  });

  it('initializes the build after validating its parent', async () => {
    jest.isolateModules(() => {
      require('./fork');
    });
    await settle();
    expect(build).toHaveBeenCalledWith(expect.any(Function));
    expect(console.error).not.toHaveBeenCalled();
  });

  it('rejects an invalid parent without starting a build', async () => {
    process.env.PPID = 'invalid';
    jest.isolateModules(() => {
      require('./fork');
    });
    await settle();
    expect(build).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('PPID') }),
    );
    expect(process.exitCode).toBe(1);
  });

  it('reports rejected initialization and exits unsuccessfully', async () => {
    const error = new Error('initialization rejected');
    jest.mocked(build).mockRejectedValue(error);
    jest.isolateModules(() => {
      require('./fork');
    });
    await settle();
    expect(console.error).toHaveBeenCalledWith(error);
    expect(process.exitCode).toBe(1);
  });
});
