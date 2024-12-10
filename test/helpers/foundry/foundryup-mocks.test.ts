/* global jest */
import { Dir } from 'fs';
import fs from 'fs/promises';
import { join, relative } from 'path';
import { isCodedError, parseArgs } from './helpers';
import { getCacheDirectory, getBinaryArchiveUrl } from './foundryup';

export const mockInstallBinaries = async (
  downloadedBinaries: Dir,
  BIN_DIR: string,
  cachePath: string
): Promise<Array<{operation: string, source?: string, target?: string}>> => {
  const mockOperations: Array<{operation: string, source?: string, target?: string}> = [];

  for await (const file of downloadedBinaries) {
    if (!file.isFile()) continue;

    const target = join(file.parentPath, file.name);
    const path = join(BIN_DIR, relative(cachePath, target));

    mockOperations.push({ operation: 'unlink', target: path });

    // Try to symlink first
    try {
      await fs.symlink(target, path);
      mockOperations.push({ operation: 'symlink', source: target, target: path });
    } catch (e) {
      if (!(isCodedError(e) && ['EPERM', 'EXDEV'].includes(e.code))) {
        throw e;
      }
      // If we get here, it's a permission error, so we'll copy instead
      mockOperations.push({ operation: 'copyFile', source: target, target: path });
    }

    mockOperations.push({ operation: 'getVersion', target: path });
  }

  return mockOperations;
};

export const mockDownloadAndInstallFoundryBinaries = async (): Promise<Array<{operation: string, details?: any}>> => {
  const operations: Array<{operation: string, details?: any}> = [];
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
    checksums,
  } = parsedArgs.options;

  operations.push({
    operation: 'getBinaryArchiveUrl',
    details: { repo, tag, version, platform, arch }
  });

  const BIN_ARCHIVE_URL = getBinaryArchiveUrl(repo, tag, version, platform, arch);
  const url = new URL(BIN_ARCHIVE_URL);

  operations.push({
    operation: 'checkAndDownloadBinaries',
    details: { url, binaries, cachePath: CACHE_DIR, platform, arch }
  });

  const mockDownloadedBinaries = {
    [Symbol.asyncIterator]: async function* () {
      for (const binary of binaries) {
        yield {
          name: binary,
          isFile: () => true,
          parentPath: CACHE_DIR
        };
      }
    }
  } as unknown as Dir;

  operations.push({
    operation: 'installBinaries',
    details: {
      binaries: binaries,
      binDir: 'node_modules/.bin',
      cachePath: CACHE_DIR
    }
  });

  return operations;
};