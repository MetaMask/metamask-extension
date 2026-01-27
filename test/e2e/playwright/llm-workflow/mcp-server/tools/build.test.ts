import { ErrorCodes } from '../types';
import { handleBuild } from './build';

const mockExecSync = jest.fn();
const mockExistsSync = jest.fn();

jest.mock('child_process', () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

jest.mock('fs', () => ({
  existsSync: (path: string) => mockExistsSync(path),
}));

describe('Build Tools', () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    jest.clearAllMocks();
    process.cwd = jest.fn().mockReturnValue('/test/metamask-extension');
    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  describe('handleBuild', () => {
    it('returns error when node_modules is missing', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('node_modules')) {
          return false;
        }
        return true;
      });

      const result = await handleBuild({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_DEPENDENCIES_MISSING);
        expect(result.error.message).toContain('Dependencies not installed');
      }
    });

    it('skips build when manifest exists and force is false', async () => {
      mockExistsSync.mockReturnValue(true);

      const result = await handleBuild({ force: false });

      expect(result.ok).toBe(true);
      expect(mockExecSync).not.toHaveBeenCalled();
      if (result.ok) {
        expect(result.result.buildType).toBe('build:test');
        expect(result.result.extensionPathResolved).toContain('dist/chrome');
      }
    });

    it('runs build when manifest does not exist', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('manifest.json')) {
          return false;
        }
        return true;
      });

      const result = await handleBuild({});

      expect(result.ok).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        'yarn build:test',
        expect.objectContaining({
          stdio: 'inherit',
          cwd: '/test/metamask-extension',
          timeout: 600000,
        }),
      );
    });

    it('runs build when force is true', async () => {
      mockExistsSync.mockReturnValue(true);

      const result = await handleBuild({ force: true });

      expect(result.ok).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        'yarn build:test',
        expect.any(Object),
      );
    });

    it('uses specified buildType', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('manifest.json')) {
          return false;
        }
        return true;
      });

      await handleBuild({ buildType: 'build:test' });

      expect(mockExecSync).toHaveBeenCalledWith(
        'yarn build:test',
        expect.any(Object),
      );
    });

    it('returns success with extension path', async () => {
      mockExistsSync.mockReturnValue(true);

      const result = await handleBuild({});

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.extensionPathResolved).toBe(
          '/test/metamask-extension/dist/chrome',
        );
      }
    });

    it('returns error when build command fails', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('manifest.json')) {
          return false;
        }
        return true;
      });
      mockExecSync.mockImplementation(() => {
        throw new Error('Build process exited with code 1');
      });

      const result = await handleBuild({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCodes.MM_BUILD_FAILED);
        expect(result.error.message).toContain('Build failed');
      }
    });

    it('includes buildType in error details', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('manifest.json')) {
          return false;
        }
        return true;
      });
      mockExecSync.mockImplementation(() => {
        throw new Error('Timeout');
      });

      const result = await handleBuild({ buildType: 'build:test' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.details).toEqual({ buildType: 'build:test' });
      }
    });

    it('sets 10 minute timeout for build command', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('manifest.json')) {
          return false;
        }
        return true;
      });

      await handleBuild({});

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 600000,
        }),
      );
    });

    it('includes duration in meta', async () => {
      mockExistsSync.mockReturnValue(true);

      const result = await handleBuild({});

      expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('includes timestamp in meta', async () => {
      mockExistsSync.mockReturnValue(true);

      const result = await handleBuild({});

      expect(result.meta.timestamp).toBeDefined();
      expect(new Date(result.meta.timestamp).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
    });
  });
});
