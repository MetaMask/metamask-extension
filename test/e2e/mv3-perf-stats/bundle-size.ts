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

// Webpack entry points that belong to the background / service-worker category.
const BackgroundFileRegex =
  /^(?:service-worker\.js|scripts\/contentscript\.js|scripts\/inpage\.js)$/u;

// Webpack entry point for the UI popup.
const UIFileRegex = /^ui[.]/u;

type FileStat = {
  name: string;
  size: number;
};

type BundleStats = {
  name: string;
  size: number;
  fileList: FileStat[];
};

/**
 * Recursively collects all .js files under `dir`, returning paths relative to `base`.
 *
 * @param dir - The directory to scan.
 * @param base - The base directory for computing relative paths.
 * @returns Array of relative file paths.
 */
async function collectJsFiles(dir: string, base: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsFiles(full, base)));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

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

  const files = await collectJsFiles(distFolder, distFolder);
  for (const file of files) {
    const stats = await fs.stat(path.join(distFolder, file));
    const entry = { name: file, size: stats.size };
    if (BackgroundFileRegex.test(file)) {
      backgroundFileList.push(entry);
    } else if (UIFileRegex.test(file)) {
      uiFileList.push(entry);
    } else {
      commonFileList.push(entry);
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
