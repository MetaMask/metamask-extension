import { MetaMaskBuildCapability } from './build';

const mockExecSync = jest.fn();
const mockExistsSync = jest.fn();

jest.mock('child_process', () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

jest.mock('fs', () => ({
  existsSync: (path: string) => mockExistsSync(path),
}));

describe('MetaMaskBuildCapability', () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    jest.clearAllMocks();
    process.cwd = jest.fn().mockReturnValue('/test/metamask-extension');
    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    process.cwd = originalCwd;
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

      expect(mockExecSync).toHaveBeenCalledWith(
        'yarn build:flask',
        expect.any(Object),
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

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 300000 }),
      );
    });
  });

  describe('build', () => {
    it('skips build when already built and force is false', async () => {
      mockExistsSync.mockReturnValue(true);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build();

      expect(result.success).toBe(true);
      expect(mockExecSync).not.toHaveBeenCalled();
    });

    it('runs build when manifest does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build();

      expect(result.success).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        'yarn build:test',
        expect.objectContaining({
          cwd: '/test/metamask-extension',
          stdio: 'inherit',
        }),
      );
    });

    it('runs build when force is true', async () => {
      mockExistsSync.mockReturnValue(true);
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build({ force: true });

      expect(result.success).toBe(true);
      expect(mockExecSync).toHaveBeenCalled();
    });

    it('uses buildType option when provided', async () => {
      mockExistsSync.mockReturnValue(false);
      const capability = new MetaMaskBuildCapability();

      await capability.build({ buildType: 'build:test:flask' });

      expect(mockExecSync).toHaveBeenCalledWith(
        'yarn build:test:flask',
        expect.any(Object),
      );
    });

    it('returns error result on build failure', async () => {
      mockExistsSync.mockReturnValue(false);
      mockExecSync.mockImplementation(() => {
        throw new Error('Build process exited with code 1');
      });
      const capability = new MetaMaskBuildCapability();

      const result = await capability.build();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Build process exited with code 1');
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
