const path = require('path');
const fs = require('node:fs/promises');
const { promisify } = require('node:util');
const { exec: callbackExec } = require('node:child_process');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { getManifestFlags } = require('../../development/lib/get-manifest-flag');

const exec = promisify(callbackExec);

/**
 * Stop the current CircleCI job unless it is listed among the manifest run flags.
 */
async function main() {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 <job>',
    'Check whether the given optional job should be triggered',
    (_yargs) =>
      _yargs.positional('job', {
        description:
          'The name of the job to check',
        type: 'string',
      })
      .strict(),
  );

  const manifestFlags = await getManifestFlags();

  if (!manifestFlags?.run || !manifestFlags.run.includes(argv.job)) {
    await exec('circleci step halt');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
