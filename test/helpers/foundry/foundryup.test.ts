import fs from 'fs/promises';
import { Dir, readFileSync } from 'fs';
import { join, relative } from 'path';
import { parse as parseYaml } from 'yaml';
import nock from 'nock';
import {
  checkAndDownloadBinaries,
  getBinaryArchiveUrl,
  getCacheDirectory,
} from './foundryup';
import { isCodedError } from './utils';
import { parseArgs } from './options';
import type { Binary, Checksums } from './types';
import { Architecture, Platform } from './types';

type OperationDetails = {
  path?: string;
  repo?: string;
  tag?: string;
  version?: string;
  platform?: Platform;
  arch?: Architecture;
  binaries?: string[];
  binDir?: string;
  cachePath?: string;
  url?: URL;
  checksums?: Checksums;
};

jest.mock('fs/promises', () => {
  console.log('Mocking fs/promises');
  const actualFs = jest.requireActual('fs/promises');
  return {
    ...actualFs,
    opendir: jest.fn().mockImplementation((path) => {
      console.log('Mock opendir called with path:', path);
      // Simulate ENOENT error for the first call
      const error = new Error(
        `ENOENT: no such file or directory, opendir '${path}`,
      );
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

jest.mock('./options', () => ({
  ...jest.requireActual('./options'),
  parseArgs: jest.fn(),
  printBanner: jest.fn(),
  say: jest.fn(),
  getVersion: jest.fn().mockReturnValue('0.1.0'),
  extractFrom: jest.fn().mockResolvedValue(['mock/path/to/binary']),
}));

export const mockInstallBinaries = async (
  downloadedBinaries: Dir,
  BIN_DIR: string,
  cachePath: string,
): Promise<{ operation: string; source?: string; target?: string }[]> => {
  const mockOperations: {
    operation: string;
    source?: string;
    target?: string;
  }[] = [];

  for await (const file of downloadedBinaries) {
    if (!file.isFile()) {
      continue;
    }
    const target = join(file.parentPath, file.name);
    const path = join(BIN_DIR, relative(cachePath, target));

    mockOperations.push({ operation: 'unlink', target: path });

    try {
      await fs.symlink(target, path);
      mockOperations.push({
        operation: 'symlink',
        source: target,
        target: path,
      });
    } catch (e) {
      if (!(isCodedError(e) && ['EPERM', 'EXDEV'].includes(e.code))) {
        throw e;
      }
      mockOperations.push({
        operation: 'copyFile',
        source: target,
        target: path,
      });
    }

    mockOperations.push({ operation: 'getVersion', target: path });
  }

  return mockOperations;
};

export const mockDownloadAndInstallFoundryBinaries = async (): Promise<
  { operation: string; details?: OperationDetails }[]
> => {
  const operations: { operation: string; details?: OperationDetails }[] = [];
  const parsedArgs = parseArgs();

  operations.push({ operation: 'getCacheDirectory' });
  const CACHE_DIR = getCacheDirectory();

  if (parsedArgs.command === 'cache clean') {
    await fs.rm(CACHE_DIR, { recursive: true, force: true });
    operations.push({ operation: 'cleanCache', details: { path: CACHE_DIR } });
    return operations;
  }

  const {
    repo,
    version: { version, tag },
    arch,
    platform,
    binaries,
  } = parsedArgs.options;

  operations.push({
    operation: 'getBinaryArchiveUrl',
    details: { repo, tag, version, platform, arch },
  });

  const BIN_ARCHIVE_URL = getBinaryArchiveUrl(
    repo,
    tag,
    version,
    platform,
    arch,
  );
  const url = new URL(BIN_ARCHIVE_URL);

  operations.push({
    operation: 'checkAndDownloadBinaries',
    details: { url, binaries, cachePath: CACHE_DIR, platform, arch },
  });

  operations.push({
    operation: 'installBinaries',
    details: {
      binaries,
      binDir: 'node_modules/.bin',
      cachePath: CACHE_DIR,
    },
  });

  return operations;
};

describe('foundryup', () => {
  describe('getCacheDirectory', () => {
    it('uses global cache when enabled in .yarnrc.yml', () => {
      (parseYaml as jest.Mock).mockReturnValue({ enableGlobalCache: true });
      (readFileSync as jest.Mock).mockReturnValue('dummy yaml content');

      const result = getCacheDirectory();
      expect(result).toMatch(/^\/(home|Users)\/.*\/.cache\/metamask$/u);
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
        Architecture.Amd64,
      );

      expect(result).toMatch(/^https:\/\/github.com\/.*\.tar\.gz$/u);
    });

    it('generates correct download URL for Windows', () => {
      const result = getBinaryArchiveUrl(
        'foundry-rs/foundry',
        'v1.0.0',
        '1.0.0',
        Platform.Windows,
        Architecture.Amd64,
      );

      expect(result).toMatch(/^https:\/\/github.com\/.*\.zip$/u);
    });
  });

  describe('checkAndDownloadBinaries', () => {
    const mockUrl = new URL('https://example.com/binaries');
    const mockBinaries = ['forge'] as Binary[];
    const mockCachePath = './test-cache-path';

    beforeEach(() => {
      jest.clearAllMocks();
      nock.cleanAll();
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
          Platform.Linux,
          Architecture.Amd64,
        ),
      ).rejects.toThrow();
    });
  });

  describe('installBinaries', () => {
    const mockBinDir = '/mock/bin/dir';
    const mockCachePath = '/mock/cache/path';
    const mockDir = {
      async *[Symbol.asyncIterator]() {
        yield {
          name: 'forge',
          isFile: () => true,
          parentPath: mockCachePath,
        };
      },
    } as unknown as Dir;

    it('should correctly install binaries and create symlinks', async () => {
      const operations = await mockInstallBinaries(
        mockDir,
        mockBinDir,
        mockCachePath,
      );

      expect(operations).toEqual([
        { operation: 'unlink', target: `${mockBinDir}/forge` },
        {
          operation: 'symlink',
          source: `${mockCachePath}/forge`,
          target: `${mockBinDir}/forge`,
        },
        { operation: 'getVersion', target: `${mockBinDir}/forge` },
      ]);
    });

    it('should fall back to copying files when symlink fails with EPERM', async () => {
      const epermError = new Error('EPERM') as NodeJS.ErrnoException;
      epermError.code = 'EPERM';

      // Mock symlink to fail
      (fs.symlink as jest.Mock).mockRejectedValueOnce(epermError);

      const operations = await mockInstallBinaries(
        mockDir,
        mockBinDir,
        mockCachePath,
      );

      expect(operations).toEqual([
        { operation: 'unlink', target: `${mockBinDir}/forge` },
        {
          operation: 'copyFile',
          source: `${mockCachePath}/forge`,
          target: `${mockBinDir}/forge`,
        },
        { operation: 'getVersion', target: `${mockBinDir}/forge` },
      ]);
    });

    it('should throw error for non-permission-related symlink failures', async () => {
      const otherError = new Error('Other error');

      // Mock symlink to fail with other error
      jest.spyOn(fs, 'symlink').mockRejectedValue(otherError);

      await expect(
        mockInstallBinaries(mockDir, mockBinDir, mockCachePath),
      ).rejects.toThrow('Other error');
    });
  });

  describe('downloadAndInstallFoundryBinaries', () => {
    const mockArgs = {
      command: '',
      options: {
        repo: 'foundry-rs/foundry',
        version: {
          version: '1.0.0',
          tag: 'v1.0.0',
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
              'win32-arm64': 'mock-checksum',
            },
            anvil: {
              'linux-amd64': 'mock-checksum',
              'linux-arm64': 'mock-checksum',
              'darwin-amd64': 'mock-checksum',
              'darwin-arm64': 'mock-checksum',
              'win32-amd64': 'mock-checksum',
              'win32-arm64': 'mock-checksum',
            },
          },
        },
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      const mockedOptions = jest.requireMock('./options');

      mockedOptions.parseArgs.mockReturnValue(mockArgs);
      mockedOptions.printBanner.mockImplementation(jest.fn());
      mockedOptions.say.mockImplementation(jest.fn());
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
            arch: Architecture.Amd64,
          },
        },
        {
          operation: 'checkAndDownloadBinaries',
          details: expect.objectContaining({
            binaries: ['forge', 'anvil'],
            platform: Platform.Linux,
            arch: Architecture.Amd64,
          }),
        },
        {
          operation: 'installBinaries',
          details: {
            binaries: ['forge', 'anvil'],
            binDir: 'node_modules/.bin',
            cachePath: expect.stringContaining('metamask'),
          },
        },
      ]);
    });

    it('should handle cache clean command', async () => {
      const mockCleanArgs = {
        ...mockArgs,
        command: 'cache clean',
      };

      (parseArgs as jest.Mock).mockReturnValue(mockCleanArgs);
      const rmSpy = jest.spyOn(fs, 'rm').mockResolvedValue();

      const operations = await mockDownloadAndInstallFoundryBinaries();

      expect(operations).toEqual([
        { operation: 'getCacheDirectory' },
        {
          operation: 'cleanCache',
          details: {
            path: expect.stringContaining('metamask'),
          },
        },
      ]);
      expect(rmSpy).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(fs, 'rm').mockRejectedValue(new Error('Mock error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockCleanArgs = {
        ...mockArgs,
        command: 'cache clean',
      };

      (parseArgs as jest.Mock).mockReturnValue(mockCleanArgs);

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
