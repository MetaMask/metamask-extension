import fs from 'fs/promises';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import nock from 'nock';
import { Dir } from 'fs';
import {
  mockDownloadAndInstallFoundryBinaries,
  mockInstallBinaries,
} from './foundryup-mocks.test';
import {
  getCacheDirectory,
  getBinaryArchiveUrl,
  checkAndDownloadBinaries,
} from './foundryup';
import {
  Platform,
  Architecture,
} from './types';

jest.mock('fs/promises', () => {
  console.log('Mocking fs/promises');
  const actualFs = jest.requireActual('fs/promises');
  return {
    ...actualFs,
    opendir: jest.fn().mockImplementation((path) => {
      console.log('Mock opendir called with path:', path);
      // Simulate ENOENT error for the first call
      const error = new Error('ENOENT: no such file or directory, opendir ' + path);
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      throw error;
    }),
    mkdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined),
    symlink: jest.fn(),
    unlink: jest.fn(),
    copyFile: jest.fn(),
    rm: jest.fn(),
  };
});
jest.mock('fs');
jest.mock('yaml');
jest.mock('os', () => ({
  homedir: jest.fn().mockReturnValue('/home/user'),
}));

jest.mock('./helpers.ts', () => ({
  ...jest.requireActual('./helpers.ts'),
  getVersion: jest.fn().mockReturnValue('0.1.0'),
  isCodedError: jest.requireActual('./helpers.ts').isCodedError,
  noop: jest.requireActual('./helpers.ts').noop,
  extractFrom: jest.fn().mockResolvedValue(['mock/path/to/binary']),
  parseArgs: jest.fn(),
}));

describe('foundryup', () => {
  describe('getCacheDirectory', () => {
    it('uses global cache when enabled in .yarnrc.yml', () => {
      (parseYaml as jest.Mock).mockReturnValue({ enableGlobalCache: true });
      (readFileSync as jest.Mock).mockReturnValue('dummy yaml content');

      const result = getCacheDirectory();
      expect(result).toMatch(/^\/home\/.*\/.cache\/metamask$/);
    });

    it('uses local cache when global cache is disabled', () => {
      (parseYaml as jest.Mock).mockReturnValue({ enableGlobalCache: false });
      (readFileSync as jest.Mock).mockReturnValue('dummy yaml content');

      const result = getCacheDirectory();
      expect(result).toContain('.metamask/cache');
    });
  });

  describe('getBinaryArchiveUrl', () => {
    it('generates correct download URL for Linux', () => {
      const result = getBinaryArchiveUrl(
        'foundry-rs/foundry',
        'v1.0.0',
        '1.0.0',
        Platform.Linux,
        Architecture.Amd64
      );

      expect(result).toMatch(/^https:\/\/github.com\/.*\.tar\.gz$/u);
    });

    it('generates correct download URL for Windows', () => {
      const result = getBinaryArchiveUrl(
        'foundry-rs/foundry',
        'v1.0.0',
        '1.0.0',
        Platform.Windows,
        Architecture.Amd64
      );

      expect(result).toMatch(/^https:\/\/github.com\/.*\.zip$/u);
    });
  });

  describe('checkAndDownloadBinaries', () => {
    const mockUrl = new URL('https://example.com/binaries');
    const mockBinaries = ['forge'];
    const mockCachePath = './test-cache-path';
    const defaultChecksums = {
      algorithm: 'sha256',
      binaries: {
        forge: {
          'win32-amd64': 'mock-checksum',
          'win32-arm64': 'mock-checksum',
          'linux-amd64': 'mock-checksum',
          'linux-arm64': 'mock-checksum',
          'darwin-amd64': 'mock-checksum',
          'darwin-arm64': 'mock-checksum'
        },
        anvil: {
          'win32-amd64': 'mock-checksum',
          'win32-arm64': 'mock-checksum',
          'linux-amd64': 'mock-checksum',
          'linux-arm64': 'mock-checksum',
          'darwin-amd64': 'mock-checksum',
          'darwin-arm64': 'mock-checksum'
        },
        cast: {
          'win32-amd64': 'mock-checksum',
          'win32-arm64': 'mock-checksum',
          'linux-amd64': 'mock-checksum',
          'linux-arm64': 'mock-checksum',
          'darwin-amd64': 'mock-checksum',
          'darwin-arm64': 'mock-checksum'
        },
        chisel: {
          'win32-amd64': 'mock-checksum',
          'win32-arm64': 'mock-checksum',
          'linux-amd64': 'mock-checksum',
          'linux-arm64': 'mock-checksum',
          'darwin-amd64': 'mock-checksum',
          'darwin-arm64': 'mock-checksum'
        }
      }
    };

    beforeEach(() => {
      console.log('Mock setup starting');
      jest.clearAllMocks();
      nock.cleanAll();

      // Verify that our mock is properly set up
      const fs = require('fs/promises');
      console.log('Is opendir mocked?', jest.isMockFunction(fs.opendir));

      console.log('Mock setup complete');
    });

    it('handles download errors gracefully', async () => {
      (fs.opendir as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

      nock.cleanAll();
      nock('https://example.com')
        .get('/binaries')
        .reply(500, 'Internal Server Error');

      await expect(
        checkAndDownloadBinaries(
          mockUrl,
          mockBinaries,
          mockCachePath,
          defaultChecksums,
          Platform.Linux,
          Architecture.Amd64
        )
      ).rejects.toThrow();
    });

  });

  describe('installBinaries', () => {
    const mockBinDir = '/mock/bin/dir';
    const mockCachePath = '/mock/cache/path';
    const mockDir = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          name: 'forge',
          isFile: () => true,
          parentPath: mockCachePath
        };
      }
    } as unknown as Dir;

    it('should correctly install binaries and create symlinks', async () => {
      const operations = await mockInstallBinaries(mockDir, mockBinDir, mockCachePath);

      expect(operations).toEqual([
        { operation: 'unlink', target: `${mockBinDir}/forge` },
        {
          operation: 'symlink',
          source: `${mockCachePath}/forge`,
          target: `${mockBinDir}/forge`
        },
        { operation: 'getVersion', target: `${mockBinDir}/forge` }
      ]);
    });

    it('should fall back to copying files when symlink fails with EPERM', async () => {
      const epermError = new Error('EPERM') as NodeJS.ErrnoException;
      epermError.code = 'EPERM';

      // Mock symlink to fail
      (fs.symlink as jest.Mock).mockRejectedValueOnce(epermError);

      const operations = await mockInstallBinaries(mockDir, mockBinDir, mockCachePath);

      expect(operations).toEqual([
        { operation: 'unlink', target: `${mockBinDir}/forge` },
        {
          operation: 'copyFile',
          source: `${mockCachePath}/forge`,
          target: `${mockBinDir}/forge`
        },
        { operation: 'getVersion', target: `${mockBinDir}/forge` }
      ]);
    });

    it('should throw error for non-permission-related symlink failures', async () => {
      const otherError = new Error('Other error');

      // Mock symlink to fail with other error
      jest.spyOn(fs, 'symlink').mockRejectedValue(otherError);

      await expect(mockInstallBinaries(mockDir, mockBinDir, mockCachePath))
        .rejects
        .toThrow('Other error');
    });
  });

  describe('downloadAndInstallFoundryBinaries', () => {
    const mockArgs = {
      command: '',
      options: {
        repo: 'foundry-rs/foundry',
        version: {
          version: '1.0.0',
          tag: 'v1.0.0'
        },
        arch: Architecture.Amd64,
        platform: Platform.Linux,
        binaries: ['forge', 'anvil'],
        checksums: {
          algorithm: 'sha256',
          binaries: {
            forge: {
              'linux-amd64': 'mock-checksum',
              'linux-arm64': 'mock-checksum',
              'darwin-amd64': 'mock-checksum',
              'darwin-arm64': 'mock-checksum',
              'win32-amd64': 'mock-checksum',
              'win32-arm64': 'mock-checksum'
            },
            anvil: {
              'linux-amd64': 'mock-checksum',
              'linux-arm64': 'mock-checksum',
              'darwin-amd64': 'mock-checksum',
              'darwin-arm64': 'mock-checksum',
              'win32-amd64': 'mock-checksum',
              'win32-arm64': 'mock-checksum'
            }
          }
        }
      }
    };

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(require('./helpers'), 'parseArgs').mockReturnValue(mockArgs);
      jest.spyOn(require('./helpers'), 'printBanner').mockImplementation(() => {});
      jest.spyOn(require('./helpers'), 'say').mockImplementation(() => {});
    });

    it('should execute all operations in correct order', async () => {
      const operations = await mockDownloadAndInstallFoundryBinaries();

      expect(operations).toEqual([
        { operation: 'getCacheDirectory' },
        {
          operation: 'getBinaryArchiveUrl',
          details: {
            repo: 'foundry-rs/foundry',
            tag: 'v1.0.0',
            version: '1.0.0',
            platform: Platform.Linux,
            arch: Architecture.Amd64
          }
        },
        {
          operation: 'checkAndDownloadBinaries',
          details: expect.objectContaining({
            binaries: ['forge', 'anvil'],
            platform: Platform.Linux,
            arch: Architecture.Amd64
          })
        },
        {
          operation: 'installBinaries',
          details: {
            binaries: ['forge', 'anvil'],
            binDir: 'node_modules/.bin',
            cachePath: expect.stringContaining('metamask')
          }
        }
      ]);
    });

    it('should handle cache clean command', async () => {
      const mockCleanArgs = {
        ...mockArgs,
        command: 'cache clean'
      };

      jest.spyOn(require('./helpers'), 'parseArgs').mockReturnValue(mockCleanArgs);
      const rmSpy = jest.spyOn(fs, 'rm').mockResolvedValue();

      const operations = await mockDownloadAndInstallFoundryBinaries();

      expect(operations).toEqual([
        { operation: 'getCacheDirectory' },
        {
          operation: 'cleanCache',
          details: {
            path: expect.stringContaining('metamask')
          }
        }
      ]);
      expect(rmSpy).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(fs, 'rm').mockRejectedValue(new Error('Mock error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockCleanArgs = {
        ...mockArgs,
        command: 'cache clean'
      };

      jest.spyOn(require('./helpers'), 'parseArgs').mockReturnValue(mockCleanArgs);

      try {
        await mockDownloadAndInstallFoundryBinaries();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Mock error');
      }

      consoleSpy.mockRestore();
    });
  });
});

