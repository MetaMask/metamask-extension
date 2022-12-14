const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const { runCommand, runInShell } = require('../development/lib/run-command');

const { CIRCLE_NODE_INDEX, CIRCLE_NODE_TOTAL } = process.env;

const GLOBAL_JEST_CONFIG = './jest.config.js';
const DEVELOPMENT_JEST_CONFIG = './development/jest.config.js';

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * @typedef {object} JestParams
 * @property {'global' | 'dev'} target - Which configuration to use for Jest.
 * @property {boolean} [coverage] - Whether to collect coverage during testing.
 * @property {number} [currentShard] - Current process number when using test
 *  splitting across many processes.
 * @property {number} [totalShards] - Total number of processes tests will be
 *  split across.
 * @property {number} [maxWorkers] - Total number of workers to use when
 *  running tests.
 */

/**
 * Execute jest test runner with given params
 *
 * @param {JestParams} params - Configuration for jest test runner
 */
async function runJest(
  { target, coverage, currentShard, totalShards, maxWorkers } = {
    target: 'global',
    coverage: false,
    currentShard: 1,
    totalShards: 1,
    maxWorkers: 2,
  },
) {
  const options = [
    'jest',
    `--config=${
      target === 'global' ? GLOBAL_JEST_CONFIG : DEVELOPMENT_JEST_CONFIG
    }`,
  ];
  options.push(`--maxWorkers=${maxWorkers}`);
  if (coverage) {
    options.push('--coverage');
  }
  // We use jest's new 'shard' feature to run tests in parallel across many
  // different processes if totalShards > 1
  if (totalShards > 1) {
    options.push(`--shard=${currentShard}/${totalShards}`);
  }
  await runInShell('yarn', options);
  if (coverage) {
    // Once done we rename the coverage file so that it is unique among test
    // runners and job number
    await runCommand('mv', [
      './coverage/coverage-final.json',
      `./coverage/coverage-final-${target}-${currentShard}.json`,
    ]);
  }
}

/**
 * Run mocha tests on the app directory. Mocha tests do not yet support
 * parallelism / test-splitting.
 *
 * @param {boolean} coverage - Use nyc to collect coverage
 */
async function runMocha({ coverage }) {
  const options = ['mocha', './app/**/*.test.js'];
  // If coverage is true, then we need to run nyc as the first command
  // and mocha after, so we use unshift to add three options to the beginning
  // of the options array.
  if (coverage) {
    options.unshift('nyc', '--reporter=json', 'yarn');
  }
  await runInShell('yarn', options);
  if (coverage) {
    // Once done we rename the coverage file so that it is unique among test
    // runners
    await runCommand('mv', [
      './coverage/coverage-final.json',
      `./coverage/coverage-final-mocha.json`,
    ]);
  }
}

async function start() {
  const {
    argv: { mocha, jestGlobal, jestDev, coverage, fakeParallelism, maxWorkers },
  } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Run unit tests on the application code.',
    (yargsInstance) =>
      yargsInstance
        .option('mocha', {
          alias: ['m'],
          default: false,
          description: 'Run Mocha tests',
          type: 'boolean',
        })
        .option('jestDev', {
          alias: ['d'],
          default: false,
          description: 'Run Jest tests with development folder config',
          type: 'boolean',
        })
        .option('jestGlobal', {
          alias: ['g'],
          default: false,
          demandOption: false,
          description: 'Run Jest global (primary config) tests',
          type: 'boolean',
        })
        .option('coverage', {
          alias: ['c'],
          default: true,
          demandOption: false,
          description: 'Collect coverage',
          type: 'boolean',
        })
        .option('fakeParallelism', {
          alias: ['f'],
          default: 0,
          demandOption: false,
          description:
            'Pretend to be CircleCI and fake parallelism (use at your own risk)',
          type: 'number',
        })
        .option('maxWorkers', {
          alias: ['mw'],
          default: 2,
          demandOption: false,
          description:
            'The safer way to increase performance locally, sets the number of processes to use internally. Recommended 2',
          type: 'number',
        })
        .strict(),
  );

  const circleNodeIndex = parseInt(CIRCLE_NODE_INDEX ?? '0', 10);
  const circleNodeTotal = parseInt(CIRCLE_NODE_TOTAL ?? '1', 10);

  const maxProcesses = fakeParallelism > 0 ? fakeParallelism : circleNodeTotal;
  const currentProcess = circleNodeIndex;

  if (fakeParallelism) {
    console.log(
      `Using fake parallelism of ${fakeParallelism}. Your machine may become as useful as a brick during this operation.`,
    );
    if (jestGlobal && jestDev) {
      throw new Error(
        'Do not try to run both jest test configs with fakeParallelism, bad things could happen.',
      );
    } else if (mocha) {
      throw new Error('Test splitting is not supported for mocha yet.');
    } else {
      const processes = [];
      for (let x = 0; x < fakeParallelism; x++) {
        processes.push(
          runJest({
            target: jestGlobal ? 'global' : 'dev',
            totalShards: fakeParallelism,
            currentShard: x + 1,
            maxWorkers: 1, // ignore maxWorker option on purpose
          }),
        );
      }
      await Promise.all(processes);
    }
  } else {
    const options = {
      coverage,
      currentShard: currentProcess + 1,
      totalShards: maxProcesses,
      maxWorkers,
    };
    if (mocha) {
      await runMocha(options);
    }
    if (jestDev) {
      await runJest({ target: 'dev', ...options });
    }
    if (jestGlobal) {
      await runJest({ target: 'global', ...options });
    }
  }
}
