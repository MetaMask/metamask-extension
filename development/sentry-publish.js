#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { runCommand, runInShell } = require('./lib/run-command');
const { getVersion } = require('./lib/get-version');
const { loadBuildTypesConfig } = require('./lib/build-type');

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function start() {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Publish a release to Sentry',
    (_yargs) =>
      _yargs
        .option('org', {
          default: 'metamask',
          description: 'The Sentry organization',
          type: 'string',
        })
        .option('project', {
          default: 'metamask',
          description: 'The Sentry project to publish',
          type: 'string',
        })
        .option('build-type', {
          default: loadBuildTypesConfig().default,
          description: 'The MetaMask extension build type',
          choices: Object.keys(loadBuildTypesConfig().buildTypes),
        })
        .option('build-version', {
          default: 0,
          description: 'The MetaMask extension build version',
          type: 'number',
        })
        .option('dist', {
          description:
            'The MetaMask extension build distribution (typically for MV2 builds, omit for MV3)',
          type: 'string',
        })
        .option('dist-directory', {
          default: 'dist',
          description: 'The MetaMask extension build dist directory path',
          type: 'string',
        }),
  );

  const { buildType, buildVersion, dist, distDirectory, org, project } = argv;

  process.env.SENTRY_ORG = org;
  process.env.SENTRY_PROJECT = project;

  const authWorked = await checkIfAuthWorks();
  if (!authWorked) {
    throw new Error(`Sentry auth failed`);
  }

  const version = getVersion(buildType, buildVersion);

  // check if version exists or not
  const versionAlreadyExists = await checkIfVersionExists(version);
  // abort if versions exists
  if (versionAlreadyExists) {
    console.log(
      `Version "${version}" already exists on Sentry, skipping version creation`,
    );
  } else {
    // create sentry release
    console.log(`creating Sentry release for "${version}"...`);
    await runCommand('sentry-cli', ['releases', 'new', version]);
    console.log(
      `removing any existing files from Sentry release "${version}"...`,
    );
    await runCommand('sentry-cli', [
      'releases',
      'files',
      version,
      'delete',
      '--all',
    ]);
  }

  const absoluteDistDirectory = path.resolve(__dirname, '../', distDirectory);
  await assertIsNonEmptyDirectory(absoluteDistDirectory);

  const additionalUploadArgs = ['--dist-directory', distDirectory];
  if (dist) {
    additionalUploadArgs.push('--dist', dist);
  }
  // upload sentry source and sourcemaps
  await runInShell('./development/sentry-upload-artifacts.sh', [
    '--release',
    version,
    ...additionalUploadArgs,
  ]);
}

async function checkIfAuthWorks() {
  return await doesNotFail(() =>
    runCommand('sentry-cli', ['releases', 'list']),
  );
}

async function checkIfVersionExists(version) {
  return await doesNotFail(() =>
    runCommand('sentry-cli', ['releases', 'info', version]),
  );
}

async function doesNotFail(asyncFn) {
  try {
    await asyncFn();
    return true;
  } catch (error) {
    if (error.message === `Exited with code '1'`) {
      return false;
    }
    throw error;
  }
}

/**
 * Assert that the given path exists, and is a non-empty directory.
 *
 * @param {string} directoryPath - The path to check.
 */
async function assertIsNonEmptyDirectory(directoryPath) {
  await assertIsDirectory(directoryPath);

  const files = await fs.readdir(directoryPath);
  if (!files.length) {
    throw new Error(`Directory empty: '${directoryPath}'`);
  }
}

/**
 * Assert that the given path exists, and is a directory.
 *
 * @param {string} directoryPath - The path to check.
 */
async function assertIsDirectory(directoryPath) {
  try {
    const directoryStats = await fs.stat(directoryPath);
    if (!directoryStats.isDirectory()) {
      throw new Error(`Invalid path '${directoryPath}'; must be a directory`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Directory '${directoryPath}' not found`, {
        cause: error,
      });
    }
    throw error;
  }
}
