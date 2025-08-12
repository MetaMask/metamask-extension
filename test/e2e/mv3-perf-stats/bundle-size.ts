import { promises as fs } from 'fs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../../development/lib/exit-with-error';
import {
  getFirstParentDirectoryThatExists,
  isWritable,
} from '../../helpers/file';

/**
 * The e2e test case is used to capture bundle time statistics for extension.
 */

const backgroundFiles: string[] = [
  'scripts/runtime-lavamoat.js',
  'scripts/lockdown-more.js',
  'scripts/sentry-install.js',
  'scripts/policy-load.js',
];

const uiFiles: string[] = [
  'scripts/sentry-install.js',
  'scripts/runtime-lavamoat.js',
  'scripts/lockdown-more.js',
  'scripts/policy-load.js',
];

const BackgroundFileRegex = /background-[0-9]*.js/u;
const CommonFileRegex = /common-[0-9]*.js/u;
const UIFileRegex = /ui-[0-9]*.js/u;

type FileStat = {
  name: string;
  size: number;
};

type BundleStats = {
  name: string;
  size: number;
  fileList: FileStat[];
};

async function main(): Promise<void> {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Capture bundle size stats',
    (_yargs) =>
      _yargs.option('out', {
        description:
          'Output filename. Output printed to STDOUT if this is omitted.',
        type: 'string',
        normalize: true,
      }),
  );
  const { out } = argv as { out?: string };

  const distFolder = 'dist/chrome';
  const backgroundFileList: FileStat[] = [];
  const uiFileList: FileStat[] = [];
  const commonFileList: FileStat[] = [];

  const files = await fs.readdir(distFolder);
  for (const file of files) {
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

  const result: Record<string, BundleStats> = {
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
    const existingParentDirectory =
      await getFirstParentDirectoryThatExists(outputDirectory);
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
