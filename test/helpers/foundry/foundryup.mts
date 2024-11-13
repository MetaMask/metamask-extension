#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

import { join, relative } from 'node:path';
import { homedir } from 'node:os';
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
import { Dir } from 'node:fs';
import { opendir, symlink, unlink, copyFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const parsedArgs = parseArgs();

const CACHE_DIR = join(homedir(), '.cache', 'metamask-extension');

if (parsedArgs.command === 'cache clean') {
  await rm(CACHE_DIR, { recursive: true, force: true });
  say('done!');
  process.exit(0);
}

const {
  repo,
  version: { version, tag },
  arch,
  platform,
  binaries,
} = parsedArgs.options;

printBanner();

say(
  `installing foundry (version ${version}, tag ${tag}) for ${platform} ${arch}`,
);

const ext = platform === Platform.Windows ? BinFormat.Zip : BinFormat.Tar;
const BIN_ARCHIVE_URL = `https://github.com/${repo}/releases/download/${tag}/foundry_${version}_${platform}_${arch}.${ext}`;
const BIN_DIR = join(process.cwd(), 'node_modules', '.bin');

say(`downloading ${binaries.join(', ')}`);
const url = new URL(BIN_ARCHIVE_URL);
const cacheKey = createHash('sha256')
  .update(`${BIN_ARCHIVE_URL}-${binaries.join('_')}`)
  .digest('hex');
const cachePath = join(CACHE_DIR, cacheKey);

// check the cache, if the cache dir exists we assume the correct files do, too
let downloadedBinaries: Dir;
try {
  downloadedBinaries = await opendir(cachePath);
} catch (e: unknown) {
  if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
    // directory doesn't exist, download and extract
    await extractFrom(url, binaries, cachePath);
    downloadedBinaries = await opendir(cachePath);
  } else {
    throw e;
  }
}
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
    // symlinking can fail if its a cross-device/filesystem link, or for
    // permissions reasons, so we'll just copy the file instead
    await copyFile(target, path);
  }
  // check that it works by logging the version
  say(`installed - ${getVersion(target)}`);
}

say('done!');
