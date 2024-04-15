#!/usr/bin/env node
const concurrently = require('concurrently');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { loadBuildTypesConfig } = require('./lib/build-type');

const buildTypesConfig = loadBuildTypesConfig();

start().catch((error) => {
  console.error('Policy generation failed.', error);
  process.exitCode = 1;
});

async function start() {
  const {
    argv: { buildTypes, parallel, devMode },
  } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Generate the LavaMoat policy file for one more more build types.',
    (yargsInstance) =>
      yargsInstance
        .option('build-types', {
          alias: ['t'],
          choices: Object.keys(buildTypesConfig.buildTypes),
          default: Object.keys(buildTypesConfig.buildTypes),
          demandOption: true,
          description: 'The build type(s) to generate policy files for.',
        })
        .option('parallel', {
          alias: ['p'],
          default: true,
          demandOption: true,
          description: 'Whether to generate policies in parallel.',
          type: 'boolean',
        })
        .option('devMode', {
          alias: ['d'],
          default: false,
          demandOption: true,
          description:
            'Whether to run the process under lavamoat (devMode=false) or node (devMode=true)',
          type: 'boolean',
        })
        .strict(),
  );

  const buildCommand = devMode ? 'build:dev' : 'build';
  const { result } = concurrently(
    (Array.isArray(buildTypes) ? buildTypes : [buildTypes]).map(
      (buildType) => ({
        command: `yarn ${buildCommand} scripts:dist --policy-only --lint-fence-files=false --build-type=${buildType}`,
        env: {
          WRITE_AUTO_POLICY: 1,
        },
        name: buildType,
      }),
    ),
    {
      killOthers: true,
      maxProcesses: parallel ? buildTypes.length : 1,
    },
  );
  await result;

  console.log('Policy file(s) successfully generated!');
}
