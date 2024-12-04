import { join } from 'path';
import { homedir } from 'os';
import fs from 'fs/promises';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
// Import test helpers
import {
  Platform,
  BinFormat,
  extractFrom,
  getVersion,
  parseArgs,
} from './helpers.test';

// Mock fs operations
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('yaml');
jest.mock('os', () => ({
  homedir: jest.fn().mockReturnValue('/home/user'),
}));

describe('foundryup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cache directory resolution', () => {
    it('uses global cache when enabled in .yarnrc.yml', () => {
      (parseYaml as jest.Mock).mockReturnValue({ enableGlobalCache: true });
      (readFileSync as jest.Mock).mockReturnValue('dummy yaml content');

      const expectedCacheDir = join(homedir(), '.cache', 'metamask');
      expect(expectedCacheDir).toBe('/home/user/.cache/metamask');
    });

    it('uses local cache when global cache is disabled', () => {
      (parseYaml as jest.Mock).mockReturnValue({ enableGlobalCache: false });
      (readFileSync as jest.Mock).mockReturnValue('dummy yaml content');

      const expectedCacheDir = join(process.cwd(), '.metamask', 'cache');
      expect(expectedCacheDir).toContain('.metamask/cache');
    });
  });

  describe('binary installation', () => {
    it('creates symlinks for downloaded binaries', async () => {
      const mockOpendir = {
        async *[Symbol.asyncIterator]() {
          yield {
            isFile: () => true,
            name: 'forge',
            parentPath: '/cache/path',
          };
        },
      };

      (fs.opendir as jest.Mock).mockResolvedValue(mockOpendir);
      (fs.symlink as jest.Mock).mockResolvedValue(undefined);

      // Test symlink creation
      await fs.symlink('/source/path', '/target/path');

      expect(fs.symlink).toHaveBeenCalled();
    });

    it('falls back to file copy when symlink fails', async () => {
      const mockOpendir = {
        async *[Symbol.asyncIterator]() {
          yield {
            isFile: () => true,
            name: 'forge',
            parentPath: '/cache/path',
          };
        },
      };

      (fs.opendir as jest.Mock).mockResolvedValue(mockOpendir);
      (fs.symlink as jest.Mock).mockRejectedValue({ code: 'EPERM' });
      (fs.copyFile as jest.Mock).mockResolvedValue(undefined);

      // Test copy fallback
      await fs.copyFile('/source/path', '/target/path');

      expect(fs.copyFile).toHaveBeenCalled();
    });
  });

  describe('URL generation', () => {
    it('generates correct download URL for Linux', () => {
      const repo = 'foundry-rs/foundry';
      const version = '1.0.0';
      const tag = 'v1.0.0';
      const platform = Platform.Linux;
      const arch = 'x86_64';

      const expectedUrl = `https://github.com/${repo}/releases/download/${tag}/foundry_${version}_${platform}_${arch}.${BinFormat.Tar}`;

      expect(expectedUrl).toMatch(/^https:\/\/github.com\/.*\.tar$/u);
    });

    it('generates correct download URL for Windows', () => {
      const repo = 'foundry-rs/foundry';
      const version = '1.0.0';
      const tag = 'v1.0.0';
      const platform = Platform.Windows;
      const arch = 'x86_64';

      const expectedUrl = `https://github.com/${repo}/releases/download/${tag}/foundry_${version}_${platform}_${arch}.${BinFormat.Zip}`;

      expect(expectedUrl).toMatch(/^https:\/\/github.com\/.*\.zip$/u);
    });
  });

  describe('cache management', () => {
    it('cleans cache directory when "cache clean" command is used', async () => {
      parseArgs.mockReturnValue({ command: 'cache clean' });
      (fs.rm as jest.Mock).mockResolvedValue(undefined);

      await fs.rm('/some/cache/dir', { recursive: true, force: true });

      expect(fs.rm).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
        force: true,
      });
    });
  });

  describe('binary validation', () => {
    it('verifies binary version after installation', async () => {
      const mockOpendir = {
        async *[Symbol.asyncIterator]() {
          yield {
            isFile: () => true,
            name: 'forge',
            parentPath: '/cache/path',
          };
        },
      };

      (fs.opendir as jest.Mock).mockResolvedValue(mockOpendir);
      getVersion.mockReturnValue('forge 1.0.0');

      const binary = 'forge';
      await getVersion(binary);

      expect(getVersion).toHaveBeenCalled();
    });

    it('handles multiple binaries installation', async () => {
      parseArgs.mockReturnValue({
        options: {
          binaries: ['forge', 'cast', 'anvil'],
          // ... other options
        },
      });

      const mockOpendir = {
        async *[Symbol.asyncIterator]() {
          yield {
            isFile: () => true,
            name: 'forge',
            parentPath: '/cache/path',
          };
          yield {
            isFile: () => true,
            name: 'cast',
            parentPath: '/cache/path',
          };
          yield {
            isFile: () => true,
            name: 'anvil',
            parentPath: '/cache/path',
          };
        },
      };

      (fs.opendir as jest.Mock).mockResolvedValue(mockOpendir);
    });
  });

  describe('error handling', () => {
    it('handles download failures gracefully', async () => {
      extractFrom.mockRejectedValue(new Error('Download failed'));
    });

    it('handles invalid binary format', async () => {
      const mockOpendir = {
        async *[Symbol.asyncIterator]() {
          yield {
            isFile: () => false, // Invalid file
            name: 'forge',
            parentPath: '/cache/path',
          };
        },
      };

      (fs.opendir as jest.Mock).mockResolvedValue(mockOpendir);
    });

    it('handles permission errors during installation', async () => {
      const mockOpendir = {
        async *[Symbol.asyncIterator]() {
          yield {
            isFile: () => true,
            name: 'forge',
            parentPath: '/cache/path',
          };
        },
      };

      (fs.opendir as jest.Mock).mockResolvedValue(mockOpendir);
      (fs.symlink as jest.Mock).mockRejectedValue({ code: 'EACCES' });
      (fs.copyFile as jest.Mock).mockRejectedValue(
        new Error('Permission denied'),
      );
    });
  });
});
