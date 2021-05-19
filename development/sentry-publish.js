#!/usr/bin/env node
const VERSION = require('../dist/chrome/manifest.json').version; // eslint-disable-line import/no-unresolved
const { runCommand, runInShell } = require('./lib/run-command');

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function start() {
  if (!process.env.SENTRY_ORG) {
    throw new Error('Missing required "SENTRY_ORG" environment variable');
  } else if (!process.env.SENTRY_PROJECT) {
    throw new Error('Missing required "SENTRY_PROJECT" environment variable');
  }

  const authWorked = await checkIfAuthWorks();
  if (!authWorked) {
    throw new Error(`Sentry auth failed`);
  }
  // check if version exists or not
  const versionAlreadyExists = await checkIfVersionExists();
  // abort if versions exists
  if (versionAlreadyExists) {
    console.log(
      `Version "${VERSION}" already exists on Sentry, skipping version creation`,
    );
  } else {
    // create sentry release
    console.log(`creating Sentry release for "${VERSION}"...`);
    await runCommand('sentry-cli', ['releases', 'new', VERSION]);
    console.log(
      `removing any existing files from Sentry release "${VERSION}"...`,
    );
    await runCommand('sentry-cli', [
      'releases',
      'files',
      VERSION,
      'delete',
      '--all',
    ]);
  }

  // check if version has artifacts or not
  const versionHasArtifacts =
    versionAlreadyExists && (await checkIfVersionHasArtifacts());
  if (versionHasArtifacts) {
    console.log(
      `Version "${VERSION}" already has artifacts on Sentry, skipping sourcemap upload`,
    );
    return;
  }

  // upload sentry source and sourcemaps
  await runInShell('./development/sentry-upload-artifacts.sh', [
    '--release',
    VERSION,
  ]);
}

async function checkIfAuthWorks() {
  return await doesNotFail(() =>
    runCommand('sentry-cli', ['releases', 'list']),
  );
}

async function checkIfVersionExists() {
  return await doesNotFail(() =>
    runCommand('sentry-cli', ['releases', 'info', VERSION]),
  );
}

async function checkIfVersionHasArtifacts() {
  const [artifact] = await runCommand('sentry-cli', [
    'releases',
    'files',
    VERSION,
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
