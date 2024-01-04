export type Manifest = chrome.runtime.Manifest;
export type ManifestV2 = chrome.runtime.ManifestV2;
export type ManifestV3 = chrome.runtime.ManifestV3;

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

import chalk from "chalk";
import { SemVerVersion, isValidSemVerVersion } from '@metamask/utils';
import { merge } from 'lodash';
import { type EntryObject } from "webpack";
import type zlib from 'node:zlib';

/**
 * Supported browsers
 */
export const Browsers = ["brave", "chrome", "firefox", "opera"] as const;
export type Browser = typeof Browsers[number];

/**
 *
 * @returns Returns the currenbt version of MetaMask as specified in package.json
 * @throws Throws an error if the version is not a valid semantic version.
 */
export const getMetaMaskVersion = (): SemVerVersion => {
  const { version } = require('../package.json');
  if (isValidSemVerVersion(version)) {
    return version as SemVerVersion;
  } else {
    throw new Error(
      `Couldn't run webpack. Invalid \`version\` found in \`package.json\`. Expected a valid semantic version (https://semver.org/) but got "${version}".`,
    );
  }
};

/**
 *
 * @returns Returns `process.env` after checking that it is valid for building.
 * @throws Throws an error if `process.env` is invalid or missing required fields.
 */
export const mergeEnv = (userEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv => {
  const rawConfig = readFileSync(join(__dirname, '../.metamaskrc'));
  const env = require('dotenv').parse(rawConfig);

  env.METAMASK_VERSION = getMetaMaskVersion();
  env.METAMASK_DEBUG = true;

  // TODO: these should be dynamic somehow
  env.PHISHING_WARNING_PAGE_URL = 'http://localhost:9999';
  env.IFRAME_EXECUTION_ENVIRONMENT_URL =
    'https://execution.consensys.io/0.36.1-flask.1/index.html';
  env.METAMASK_BUILD_NAME = 'MM Webpack Test';
  env.METAMASK_BUILD_ICON = 'data:image:./images/icon-64.png';
  env.METAMASK_BUILD_APP_ID = 'io.metamask';
  env.IN_TEST = false;

  const finalEnv = { ...userEnv, ...env };

  const INFURA_PROJECT_ID = finalEnv.INFURA_PROJECT_ID;
  // if we don't have an INFURA_PROJECT_ID at build time we should bail!
  if (!INFURA_PROJECT_ID) {
    throw new Error(
      'The `INFURA_PROJECT_ID` environment variable was not supplied at build time.',
    );
  }

  // validate INFURA_KEY
  if (INFURA_PROJECT_ID) {
    if (!/^[a-f0-9]{32}$/.test(INFURA_PROJECT_ID)) {
      throw new Error(
        'INFURA_PROJECT_ID must be 32 characters long and contain only the characters a-f0-9',
      );
    }
  }

  return env;
};

export type ManifestOptions = {
  mode: 'development' | 'production';
  browser: Browser;
  version: SemVerVersion;
  name: string;
  description: string;
};

type ManifestTypeForVersion<T extends Manifest> =
  T['manifest_version'] extends 2 ? ManifestV2 : ManifestV3;

export const generateManifest = (
  baseManifest: Manifest,
  options: ManifestOptions,
): ManifestTypeForVersion<typeof baseManifest> => {
  const { version, name, description, browser } = options;

  const browserManifestOverrides: Partial<Manifest> = JSON.parse(
    readFileSync(
      join(
        __dirname,
        `../app/manifest/v${baseManifest.manifest_version}/${browser}.json`,
      ),
    ).toString('utf-8'),
  );

  const overrides = {
    version,
    name,
    description,
  };

  return merge(
    {},
    baseManifest,
    browserManifestOverrides,
    overrides,
  ) as ManifestTypeForVersion<typeof baseManifest>;
};

/**
 * Collects all entry files
 * @param dir
 * @returns
 */
export function getEntries(dir: string) {
  const entry: EntryObject = {
    // contentscript is used by the extension manifest's `content_scripts`
    contentscript: {
      chunkLoading: false,
      import: join(dir, 'scripts/contentscript.js'),
    },
    // inpage.js is injected into the page by writing a script tag to the
    // user's tab so it must be built separately from everything else.
    inpage: {
      chunkLoading: false,
      import: join(dir, 'scripts/inpage.js')
    }
  };

  for (const file of readdirSync(dir)) {
    if (!/\.html$/iu.test(file)) continue; // ignore non-htm/html files
    validateEntryFileName(file, dir);
    entry[file.slice(0, -5)] = join(dir, file); // add to entries
  }
  return entry;
}

function validateEntryFileName(file: string, dir: string) {
  if (!file.startsWith("_")) return;

  throw new DetailedError({
    problem: chalk`{red.inverse Invalid Filename Detected}\nPath: {bold.white.dim '${relative(process.cwd(), join(dir, file))}'}`,
    reason: chalk`Filenames at the root of the extension directory starting with {green "_"} are reserved for use by the browser.`,
    solutions: [
      chalk`Rename this file to remove the underscore (e.g., {bold.white.dim '${file}'} to {bold.white.dim '${file.slice(1)}'}).`,
      chalk`Move this file to a subdirectory. If necesary, add it manually to the build.`
    ],
    context: chalk`This file was included in the build automatically by our script, which adds all HTML files at the root of {dim '${dir}'}.`
  });
}

export type ErrorMessage = { problem: string, reason: string, solutions: string[], context?: string }
export class DetailedError extends Error {
  constructor({ problem, reason, solutions, context }: ErrorMessage) {
    const message = `${chalk.red(problem)}
${chalk.red("Reason:")} ${chalk.white(reason)}

${chalk.white.bold(`Suggested Action${solutions.length === 1 ? '' : 's'}:`)}
${solutions.map(solution => `${chalk.hex("EF811A")("•")} ${chalk.white(solution)}`).join('\n')}
${context ? `\n${chalk.white.dim.bold("Context:")} ${chalk.white.dim(context)}` : ``}
`;
    super(message);
    this.message = message;
    this.name = "";
  }
}

/**
 * Retrieves the datetime of the last commit in UTC for the current Git branch.
 *
 * The author timestamp is used for its consistency across different
 * repositories and its inclusion in the Git commit hash calculation. This makes
 * it a stable choice for reproducible builds.
 *
 * @returns Millisecond precision timestamp in UTC of the last commit on the
 * current branch. If the branch is detached or has no commits, it will throw an
 * error.
 * @throws Throws an error if the current branch is detached or has no commits.
 * May also throw if the Git repository is malformed (or not found).
 */
export function getLastCommitDatetimeUtc(gitDir = join(__dirname, "..", ".git")): number {
  // Note: this function is syncronous because it needs to be used in a
  // syncronous context (its also faster this way)

  // use `unzipSync` from zlib since git uses zlib-wrapped DEFLATE
  // loaded in this way to avoid requiring it when the function isn't used.
  const { unzipSync } = require('node:zlib') as typeof zlib;

  // read .git/HEAD to get the current branch/commit
  const ref = readFileSync(join(gitDir, 'HEAD'), 'utf-8').trim();

  // determine if we're in a detached HEAD state or on a branch
  const oid = ref.startsWith('ref: ')
    // HEAD is pointer to a branch; load the commit hash
    ? readFileSync(join(gitDir, ref.slice(5)), 'utf-8').trim()
    // HEAD is detached; so use the commit hash directly
    : ref;

  // read the commit object from the file system
  const commitPath = join(gitDir, 'objects', oid.slice(0, 2), oid.slice(2));
  const rawCommit = readFileSync(commitPath);
  // it's compressed with zlib DEFLATE, so we need to decompress it
  const decompressed = unzipSync(rawCommit);
  // the commit object is a text file with a header and a body, we just want the
  // body, which is after the first null byte
  const firstNull = decompressed.indexOf(0);
  const commitBuffer = decompressed.subarray(firstNull + 1);
  const commitText = new TextDecoder().decode(commitBuffer);
  // git commits are strictly formatted, so we can use a regex to extract the
  // authorship time fields
  const [, timestamp, timezoneOffset] = commitText.match(
    /^author .* <.*> (.*) (.*)$/mu
  )!;
  // convert git timestamp from seconds to milliseconds
  const msSinceLocalEpoch = (parseInt(timestamp, 10) * 1000);
  const msTimezoneOffset = (parseInt(timezoneOffset, 10) * 60000);

  return msSinceLocalEpoch - msTimezoneOffset;
}
