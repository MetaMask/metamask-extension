#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

import { join, relative } from 'node:path';
import { homedir } from 'node:os';
import { Dir, readFileSync } from 'node:fs';
import { opendir, symlink, unlink, copyFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exit, cwd } from 'node:process';
import { parse as parseYaml } from 'yaml';
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
  transformChecksums,
} from './helpers.mts';

const parsedArgs = parseArgs();

const { enableGlobalCache } = parseYaml(readFileSync('.yarnrc.yml', 'utf-8'));
const CACHE_DIR = enableGlobalCache
  ? join(homedir(), '.cache', 'metamask')
  : join(cwd(), '.metamask', 'cache');

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

const ext = platform === Platform.Windows ? BinFormat.Zip : BinFormat.Tar;
const BIN_ARCHIVE_URL = `https://github.com/${repo}/releases/download/${tag}/foundry_${version}_${platform}_${arch}.${ext}`;
const BIN_DIR = join(cwd(), 'node_modules', '.bin');

const url = new URL(BIN_ARCHIVE_URL);
const cacheKey = createHash('sha256')
  .update(`${BIN_ARCHIVE_URL}-${bins}`)
  .digest('hex');
const cachePath = join(CACHE_DIR, cacheKey);

// check the cache, if the cache dir exists we assume the correct files do, too
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

say('done!');
