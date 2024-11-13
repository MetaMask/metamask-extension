#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

import { join } from 'node:path';
import { homedir } from 'node:os';
import {
  BinFormat,
  Platform,
  extractFrom,
  getVersion,
  printBanner,
  say,
  parseArgs,
} from './helpers.mts';
import { existsSync, mkdirSync, symlinkSync, unlinkSync } from 'node:fs';

const {
  repo,
  version: { version, tag },
  arch,
  platform,
  binaries,
} = parseArgs();

printBanner();

say(`installing foundry (version ${version}, tag ${tag})`);

const ext = platform === Platform.Windows ? BinFormat.Zip : BinFormat.Tar;
const RELEASE_URL = `https://github.com/${repo}/releases/download/${tag}/`;
const BIN_ARCHIVE_URL = `${RELEASE_URL}foundry_${version}_${platform}_${arch}.${ext}`;
const BIN_DIR = join(process.cwd(), 'node_modules', '.bin');

say(`downloading ${binaries.join(', ')}`);
const url = new URL(BIN_ARCHIVE_URL);
const cacheDir = join(homedir(), '.cache', 'metamask-extension');
const cacheKey = Buffer.from(
  `${BIN_ARCHIVE_URL}-${binaries.join('_')}`,
).toString('base64url');
const cachePath = join(cacheDir, cacheKey);
if (!existsSync(cachePath)) {
  mkdirSync(cachePath, { recursive: true });
  await extractFrom(url, binaries, cachePath);
}

for (const file of binaries) {
  const path = join(BIN_DIR, file);
  try {
    // remove existing symlink
    unlinkSync(path);
  } catch {}
  const target = join(cachePath, file);
  // create new symlink
  symlinkSync(target, path);
  // check that it works and log the version
  say(`installed - ${getVersion(target)}`);
}

say('done!');
