import { MetaMaskBuildCapability } from './build';

type ExitSignal = NodeJS.Signals | null;

type MockChildProcess = {
  on: jest.Mock;
  kill: jest.Mock;
  killed: boolean;
  emitError: (error: Error) => void;
  emitExit: (code: number | null, signal?: ExitSignal) => void;
};

const mockSpawn = jest.fn();
const mockExistsSync = jest.fn();

jest.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

jest.mock('fs', () => ({
  existsSync: (path: string) => mockExistsSync(path),
}));

describe('MetaMaskBuildCapability', () => {
  const originalCwd = process.cwd;
  let activeChild: MockChildProcess;
  let nextSpawnOutcome: 'success' | 'failure' | 'error' | 'pending';

  const createMockChildProcess = (): MockChildProcess => {
    const handlers: {
      error?: (error: Error) => void;
      exit?: (code: number | null, signal: ExitSignal) => void;
    } = {};

    const child: MockChildProcess = {
      on: jest.fn((event: string, handler: unknown) => {
        if (event === 'error') {
          handlers.error = handler as (error: Error) => void;
        }

        if (event === 'exit') {
          handlers.exit = handler as (
            code: number | null,
            signal: ExitSignal,
          ) => void;
        }

        return child;
      }),
      kill: jest.fn((signal?: NodeJS.Signals) => {
        child.killed = true;
        if (signal === 'SIGTERM') {
          setImmediate(() => handlers.exit?.(null, 'SIGTERM'));
        }
        return true;
      }),
      killed: false,
      emitError: (error: Error) => {
        handlers.error?.(error);
      },
      emitExit: (code: number | null, signal: ExitSignal = null) => {
        handlers.exit?.(code, signal);
      },
    };

    return child;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.cwd = jest.fn().mockReturnValue('/test/metamask-extension');
    mockExistsSync.mockReturnValue(true);
    nextSpawnOutcome = 'success';

    mockSpawn.mockImplementation(() => {
      activeChild = createMockChildProcess();

      setImmediate(() => {
        if (nextSpawnOutcome === 'success') {
          activeChild.emitExit(0);
        } else if (nextSpawnOutcome === 'failure') {
          activeChild.emitExit(1);
        } else if (nextSpawnOutcome === 'error') {
          activeChild.emitError(new Error('spawn ENOENT'));
        }
      });

      return activeChild;
    });
  });

  afterEach(() => {
    process.cwd = originalCwd;
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('uses default values when no options provided', () => {
      const capability = new MetaMaskBuildCapability();

      expect(capability.getExtensionPath()).toBe(
        '/test/metamask-extension/dist/chrome',
      );
    });

    it('uses custom command when provided', async () => {
      mockExistsSync.mockReturnValue(false);
      const capability = new MetaMaskBuildCapability({
        command: 'yarn build:flask',
      });

      await capability.build();

      expect(mockSpawn).toHaveBeenCalledWith(
        'yarn build:flask',
        expect.objectContaining({
          cwd: '/test/metamask-extension',
          stdio: 'inherit',
          shell: true,
        }),
      );
    });

    it('uses custom output path when provided', () => {
      const capability = new MetaMaskBuildCapability({
        outputPath: 'dist/firefox',
      });

      expect(capability.getExtensionPath()).toBe(
        '/test/metamask-extension/dist/firefox',
      );
    });

    it('uses custom timeout when provided', async () => {
      mockExistsSync.mockReturnValue(false);
      const capability = new MetaMaskBuildCapability({
        timeout: 300000,
      });

      await capability.build();

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cwd: '/test/metamask-extension',
          stdio: 'inherit',
          shell: true,
        }),
      );
    });
  });

  describe('build', () => {
    it('skips build when already built and force is false', async () => {
      mockExistsSync.mockReturnValue(true);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build();

      expect(result.success).toBe(true);
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('runs build when manifest does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build();

      expect(result.success).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith(
        'yarn build:test',
        expect.objectContaining({
          cwd: '/test/metamask-extension',
          stdio: 'inherit',
          shell: true,
        }),
      );
    });

    it('runs build when force is true', async () => {
      mockExistsSync.mockReturnValue(true);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build({ force: true });

      expect(result.success).toBe(true);
      expect(mockSpawn).toHaveBeenCalled();
    });

    it('uses buildType option when provided', async () => {
      mockExistsSync.mockReturnValue(false);
      const capability = new MetaMaskBuildCapability();

      await capability.build({ buildType: 'build:test:flask' });

      expect(mockSpawn).toHaveBeenCalledWith(
        'yarn build:test:flask',
        expect.objectContaining({ shell: true }),
      );
    });

    it('returns error result on build failure', async () => {
      mockExistsSync.mockReturnValue(false);
      nextSpawnOutcome = 'failure';
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Build process exited with code 1');
    });

    it('returns error result when build times out', async () => {
      jest.useFakeTimers();
      mockExistsSync.mockReturnValue(false);
      nextSpawnOutcome = 'pending';
      const capability = new MetaMaskBuildCapability({ timeout: 10 });

      const buildPromise = capability.build();
      await jest.advanceTimersByTimeAsync(11);
      const result = await buildPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Build command timed out after 10ms');
      expect(activeChild.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('returns error result when spawn emits error', async () => {
      mockExistsSync.mockReturnValue(false);
      nextSpawnOutcome = 'error';
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build();

      expect(result.success).toBe(false);
      expect(result.error).toContain('spawn ENOENT');
    });

    it('includes duration in result', async () => {
      mockExistsSync.mockReturnValue(true);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build();

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('includes extension path in result', async () => {
      mockExistsSync.mockReturnValue(true);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build();

      expect(result.extensionPath).toBe('/test/metamask-extension/dist/chrome');
    });
  });

  describe('getExtensionPath', () => {
    it('returns full path to extension directory', () => {
      const capability = new MetaMaskBuildCapability();

      expect(capability.getExtensionPath()).toBe(
        '/test/metamask-extension/dist/chrome',
      );
    });
  });

  describe('isBuilt', () => {
    it('returns true when manifest.json exists', async () => {
      mockExistsSync.mockReturnValue(true);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.isBuilt();

      expect(result).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith(
        '/test/metamask-extension/dist/chrome/manifest.json',
      );
    });

    it('returns false when manifest.json does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.isBuilt();

      expect(result).toBe(false);
    });
  });
});
