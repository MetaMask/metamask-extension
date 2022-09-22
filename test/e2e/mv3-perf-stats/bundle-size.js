#!/usr/bin/env node

/* eslint-disable node/shebang */
const path = require('path');
const { promises: fs } = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
  isWritable,
  getFirstParentDirectoryThatExists,
} = require('../../helpers/file');

const { exitWithError } = require('../../../development/lib/exit-with-error');

/**
 * The e2e test case is used to capture bundle time statistics for extension.
 */

const backgroundFiles = [
  'runtime-lavamoat.js',
  'lockdown-more.js',
  'globalthis.js',
  'sentry-install.js',
  'policy-load.js',
];

const uiFiles = [
  'globalthis.js',
  'sentry-install.js',
  'runtime-lavamoat.js',
  'lockdown-more.js',
  'policy-load.js',
];

const BackgroundFileRegex = /background-[0-9]*.js/u;
const CommonFileRegex = /common-[0-9]*.js/u;
const UIFileRegex = /ui-[0-9]*.js/u;

async function main() {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Run a page load benchmark',
    (_yargs) =>
      _yargs.option('out', {
        description:
          'Output filename. Output printed to STDOUT of this is omitted.',
        type: 'string',
        normalize: true,
      }),
  );
  const { out } = argv;

  const distFolder = 'dist/chrome';
  const backgroundFileList = [];
  const uiFileList = [];
  const commonFileList = [];

  const files = await fs.readdir(distFolder);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (CommonFileRegex.test(file)) {
      const stats = await fs.stat(`${distFolder}/${file}`);
      commonFileList.push({ name: file, size: stats.size });
    } else if (
      backgroundFiles.includes(file) ||
      BackgroundFileRegex.test(file)
    ) {
      const stats = await fs.stat(`${distFolder}/${file}`);
      backgroundFileList.push({ name: file, size: stats.size });
    } else if (uiFiles.includes(file) || UIFileRegex.test(file)) {
      const stats = await fs.stat(`${distFolder}/${file}`);
      uiFileList.push({ name: file, size: stats.size });
    }
  }

  const backgroundBundleSize = backgroundFileList.reduce(
    (result, file) => result + file.size,
    0,
  );

  const uiBundleSize = uiFileList.reduce(
    (result, file) => result + file.size,
    0,
  );

  const commonBundleSize = commonFileList.reduce(
    (result, file) => result + file.size,
    0,
  );

  const result = {
    background: {
      name: 'background',
      size: backgroundBundleSize,
      fileList: backgroundFileList,
    },
    ui: {
      name: 'ui',
      size: uiBundleSize,
      fileList: uiFileList,
    },
    common: {
      name: 'common',
      size: commonBundleSize,
      fileList: commonFileList,
    },
  };

  if (out) {
    const outPath = `${out}/bundle_size.json`;
    const outputDirectory = path.dirname(outPath);
    const existingParentDirectory = await getFirstParentDirectoryThatExists(
      outputDirectory,
    );
    if (!(await isWritable(existingParentDirectory))) {
      throw new Error('Specified output file directory is not writable');
    }
    if (outputDirectory !== existingParentDirectory) {
      await fs.mkdir(outputDirectory, { recursive: true });
    }
    await fs.writeFile(outPath, JSON.stringify(result, null, 2));
    await fs.writeFile(
      `${out}/bundle_size_stats.json`,
      JSON.stringify(
        {
          background: backgroundBundleSize,
          ui: uiBundleSize,
          common: commonBundleSize,
          timestamp: new Date().getTime(),
        },
        null,
        2,
      ),
    );
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((error) => {
  exitWithError(error);
});
