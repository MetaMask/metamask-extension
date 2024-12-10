#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

import { join, relative } from 'node:path';
import { homedir } from 'node:os';
import { Dir, readFileSync } from 'node:fs';
import { copyFile, opendir, rm, symlink, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cwd, exit } from 'node:process';
import { parse as parseYaml } from 'yaml';
import {
  extractFrom,
  getVersion,
  isCodedError,
  noop,
  parseArgs,
  printBanner,
  say,
  transformChecksums,
} from './helpers.ts';
import {
  Architecture,
  Checksums,
  Extension,
  Platform,
} from './types';

export function getCacheDirectory(): string {
  let enableGlobalCache = false;
  try {
    const configFileContent = readFileSync('.yarnrc.yml', 'utf8');
    const parsedConfig = parseYaml(configFileContent);
    enableGlobalCache = parsedConfig?.enableGlobalCache ?? false;
  } catch (error) {
    console.error('Error reading/parsing .yarnrc.yml:', error);
  }
  return enableGlobalCache
    ? join(homedir(), '.cache', 'metamask')
    : join(cwd(), '.metamask', 'cache');
}

export function getBinaryArchiveUrl(
  repo: string,
  tag: string,
  version: string,
  platform: Platform,
  arch: string,
): string {
  const ext = platform === Platform.Windows ? Extension.Zip : Extension.Tar;
  return `https://github.com/${repo}/releases/download/${tag}/foundry_${version}_${platform}_${arch}.${ext}`;
}

export async function checkAndDownloadBinaries(
  url: URL,
  binaries: string[],
  cachePath: string,
  checksums: Checksums = {
    algorithm: 'sha256',
    binaries: {
      anvil: {
        'win32-amd64': '', 'win32-arm64': '',
        'linux-amd64': '', 'linux-arm64': '',
        'darwin-amd64': '', 'darwin-arm64': ''
      },
      forge: {
        'win32-amd64': '', 'win32-arm64': '',
        'linux-amd64': '', 'linux-arm64': '',
        'darwin-amd64': '', 'darwin-arm64': ''
      },
      cast: {
        'win32-amd64': '', 'win32-arm64': '',
        'linux-amd64': '', 'linux-arm64': '',
        'darwin-amd64': '', 'darwin-arm64': ''
      },
      chisel: {
        'win32-amd64': '', 'win32-arm64': '',
        'linux-amd64': '', 'linux-arm64': '',
        'darwin-amd64': '', 'darwin-arm64': ''
      }
    }
  },
  platform: Platform,
  arch: Architecture,
): Promise<Dir> {
  let downloadedBinaries: Dir;
  try {
    say(`checking cache`);
    downloadedBinaries = await opendir(cachePath);
    say(`found binaries in cache`);
  } catch (e: unknown) {
    say(`binaries not in cache`);
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      say(`installing from ${url.toString()}`);
    // directory doesn't exist, download and extract
      const platformChecksums = transformChecksums(checksums, platform, arch);
      await extractFrom(url, binaries, cachePath, platformChecksums);
      downloadedBinaries = await opendir(cachePath);
    } else {
      throw e;
    }
  }
  return downloadedBinaries;
}

export async function installBinaries(downloadedBinaries: Dir, BIN_DIR: string, cachePath: string): Promise<void> {
  for await (const file of downloadedBinaries) {
    if (!file.isFile()) continue;
    const target = join(file.parentPath, file.name);
    const path = join(BIN_DIR, relative(cachePath, target));
    // clean up any existing files or symlinks
    await unlink(path).catch(noop);
    try {
      // create new symlink
      await symlink(target, path);
    } catch (e) {
      if (!(isCodedError(e) && ['EPERM', 'EXDEV'].includes(e.code))) {
        throw e;
      }
      // symlinking can fail if it's a cross-device/filesystem link, or for
      // permissions reasons, so we'll just copy the file instead
      await copyFile(target, path);
    }
    // check that it works by logging the version
    say(`installed - ${getVersion(path)}`);
  }
}

export async function downloadAndInstallFoundryBinaries(): Promise<void> {
  const parsedArgs = parseArgs();

  const CACHE_DIR = getCacheDirectory();

  if (parsedArgs.command === 'cache clean') {
    await rm(CACHE_DIR, { recursive: true, force: true });
    say('done!');
    exit(0);
  }

  const {
    repo,
    version: { version, tag },
    arch,
    platform,
    binaries,
    checksums,
  } = parsedArgs.options;

  printBanner();
  const bins = binaries.join(', ');
  say(`fetching ${bins} ${version} for ${platform} ${arch}`);

  const BIN_ARCHIVE_URL = getBinaryArchiveUrl(repo, tag, version, platform, arch);
  const BIN_DIR = join(cwd(), 'node_modules', '.bin');

  const url = new URL(BIN_ARCHIVE_URL);
  const cacheKey = createHash('sha256')
    .update(`${BIN_ARCHIVE_URL}-${bins}`)
    .digest('hex');
  const cachePath = join(CACHE_DIR, cacheKey);

  const downloadedBinaries = await checkAndDownloadBinaries(
    url,
    binaries,
    cachePath,
    checksums,
    platform,
    arch
  );

  await installBinaries(downloadedBinaries, BIN_DIR, cachePath);

  say('done!');
}

// Move the auto-execution logic to a separate function
export function main() {
  downloadAndInstallFoundryBinaries().catch((error) => {
    console.error('Error:', error);
    exit(1);
  });
}

// Only run if this is the main module (not being imported for tests)
if (require.main === module) {
  main();
}
