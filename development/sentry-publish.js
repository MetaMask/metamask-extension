#!/usr/bin/env node

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
        }),
  );

  const { buildType, buildVersion, org, project } = argv;

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

  // check if version has artifacts or not
  const versionHasArtifacts =
    versionAlreadyExists && (await checkIfVersionHasArtifacts(version));
  if (versionHasArtifacts) {
    console.log(
      `Version "${version}" already has artifacts on Sentry, skipping sourcemap upload`,
    );
    return;
  }

  const additionalUploadArgs = [];
  if (buildType !== loadBuildTypesConfig().default) {
    additionalUploadArgs.push('--dist-directory', `dist-${buildType}`);
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

async function checkIfVersionHasArtifacts(version) {
  const [artifact] = await runCommand('sentry-cli', [
    'releases',
    'files',
    version,
    'list',
  ]);
  // When there's no artifacts, we get a response from the shell like this ['', '']
  return artifact?.length > 0;
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
