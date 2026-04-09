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
 * Captures bundle size statistics from the webpack-bundle-analyzer JSON report.
 *
 * Chunks are categorized into three groups based on their entrypoints:
 * - background: service-worker, content scripts (self-contained, no code splitting)
 * - ui: HTML page entrypoints and their shared/split chunks
 * - common: lazily loaded chunks with no entrypoint
 */

const BACKGROUND_ENTRYPOINTS = new Set([
  'service-worker.ts',
  'scripts/contentscript.js',
  'scripts/inpage.js',
  'vendor/trezor/content-script.js',
]);

type ReportEntry = {
  label: string;
  parsedSize: number;
  statSize: number;
  isInitialByEntrypoint: Record<string, boolean>;
};

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
    'Capture bundle size stats from bundle analyzer report',
    (_yargs) =>
      _yargs.option('out', {
        description:
          'Output directory. Output printed to STDOUT if this is omitted.',
        type: 'string',
        normalize: true,
      }),
  );
  const { out } = argv as { out?: string };

  const reportPath = 'dist/report.json';
  const report: ReportEntry[] = JSON.parse(
    await fs.readFile(reportPath, 'utf8'),
  );

  const backgroundFileList: FileStat[] = [];
  const uiFileList: FileStat[] = [];
  const commonFileList: FileStat[] = [];

  for (const entry of report) {
    const entrypoints = Object.keys(entry.isInitialByEntrypoint || {});
    const file = { name: entry.label, size: entry.parsedSize };

    if (entrypoints.length === 0) {
      // No entrypoint — common/lazy-loaded chunks shared across entry points
      commonFileList.push(file);
    } else if (entrypoints.every((ep) => BACKGROUND_ENTRYPOINTS.has(ep))) {
      // All entrypoints are background scripts
      backgroundFileList.push(file);
    } else {
      // UI entrypoints (HTML pages and their shared chunks)
      uiFileList.push(file);
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
