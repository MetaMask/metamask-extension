#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

import { join, relative } from 'node:path';
import { homedir } from 'node:os';
import { Dir } from 'node:fs';
import { opendir, symlink, unlink, copyFile, rm, chmod } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exit, cwd } from 'node:process';
import {
  BinFormat,
  Platform,
  extractFrom,
  getVersion,
  printBanner,
  say,
  parseArgs,
  isCodedError,
  noop,
} from './helpers.mts';

const parsedArgs = parseArgs();

const CACHE_DIR = join(homedir(), '.cache', 'metamask-extension');

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
} = parsedArgs.options;

printBanner();
const bins = binaries.join(', ');
say(`fetching ${bins} ${version} for ${platform} ${arch}`);

const ext = platform === Platform.Windows ? BinFormat.Zip : BinFormat.Tar;
const BIN_ARCHIVE_URL = `https://github.com/${repo}/releases/download/${tag}/foundry_${version}_${platform}_${arch}.${ext}`;
const BIN_DIR = join(cwd(), 'node_modules', '.bin');
const GLOBAL_BIN_DIR = '/usr/local/bin'; // Directory in PATH for global binaries

const url = new URL(BIN_ARCHIVE_URL);
const cacheKey = createHash('sha256')
  .update(`${BIN_ARCHIVE_URL}-${bins}`)
  .digest('hex');
const cachePath = join(CACHE_DIR, cacheKey);

// Check the cache, if the cache dir exists we assume the correct files do, too
let downloadedBinaries: Dir;
try {
  say(`checking cache`);
  downloadedBinaries = await opendir(cachePath);
  say(`found binaries in cache`);
} catch (e: unknown) {
  say(`binaries not in cache`);
  if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
    say(`installing from ${url.toString()}`);
    // Directory doesn't exist, download and extract
    await extractFrom(url, binaries, cachePath);
    downloadedBinaries = await opendir(cachePath);
  } else {
    throw e;
  }
}

for await (const file of downloadedBinaries) {
  if (!file.isFile()) continue;
  const target = join(file.parentPath, file.name);
  const localPath = join(BIN_DIR, relative(cachePath, target));
  const globalPath = join(GLOBAL_BIN_DIR, file.name);

  // Ensure the binary is executable
  await chmod(target, 0o755);

  // Clean up any existing files or symlinks
  await unlink(localPath).catch(noop);
  await unlink(globalPath).catch(noop);

  try {
    // Create new symlink in both local BIN_DIR and globalPath
    await symlink(target, localPath);
    await symlink(target, globalPath);
  } catch (e) {
    if (!(isCodedError(e) && ['EPERM', 'EXDEV'].includes(e.code))) {
      throw e;
    }
    // Symlinking can fail for cross-device/filesystem links or permissions reasons
    // Fallback: Copy the file instead
    await copyFile(target, localPath);
    await copyFile(target, globalPath);
  }
  // Check that it works by logging the version
  say(`installed - ${getVersion(target)}`);
}

say('done!');
