const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { runInShell } = require('./lib/run-command');

let osFolder = 'linux';
switch (process.platform) {
  case 'win32':
    osFolder = 'windows';
    break;
  case 'darwin':
    osFolder = 'macos';
    break;
  default:
    break;
}

const {
  argv: { chrome, firefox },
} = yargs(hideBin(process.argv)).usage(
  '$0 [options]',
  'Update local selenium browser drivers.',
  (yargsInstance) =>
    yargsInstance
      .option('chrome', {
        default: false,
        description: 'Update chromedriver',
        type: 'boolean',
      })
      .option('firefox', {
        default: false,
        description: 'Update geckodriver',
        type: 'boolean',
      })
      .strict(),
);

if (chrome) {
  runInShell(
    `node_modules/selenium-webdriver/bin/${osFolder}/selenium-manager`,
    ['--browser', 'chrome'],
  );
}

if (firefox) {
  runInShell(
    `node_modules/selenium-webdriver/bin/${osFolder}/selenium-manager`,
    ['--browser', 'firefox'],
  );
}
