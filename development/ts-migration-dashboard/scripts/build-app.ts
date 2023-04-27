import path from 'path';
import fs from 'fs-extra';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import chokidar from 'chokidar';
import browserify from 'browserify';
import pify from 'pify';
import endOfStream from 'end-of-stream';
import pump from 'pump';
import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import sass from 'sass';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';
import fg from 'fast-glob';
import buildModulePartitions from '../common/build-module-partitions';
import {
  PARTITIONS_FILE,
  writePartitionsFile,
} from '../common/partitions-file';
import {
  PROJECT_DIRECTORY_PATH,
  COMMON_DIRECTORY_PATH,
  APP_DIRECTORY_PATH,
  FINAL_BUILD_DIRECTORY_PATH,
} from '../common/constants';

const promisifiedPump = pify(pump);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Compiles a set of files that we want to convert to TypeScript, divided by
 * level in the dependency tree.
 */
async function generateIntermediateFiles() {
  const partitions = await buildModulePartitions();
  writePartitionsFile(partitions);

  console.log(
    `- Wrote intermediate partitions file: ${path.relative(
      PROJECT_DIRECTORY_PATH,
      PARTITIONS_FILE,
    )}`,
  );
}

/**
 * Compiles the JavaScript code for the dashboard.
 *
 * @param src - The path to the JavaScript entrypoint.
 * @param dest - The path to the compiled and bundled JavaScript file.
 */
async function compileScripts(src: string, dest: string) {
  const extensions = ['.js', '.ts', '.tsx'];
  const browserifyOptions: Record<string, unknown> = {
    extensions,
    // Use entryFilepath for moduleIds, easier to determine origin file
    fullPaths: true,
    // For sourcemaps
    debug: true,
  };
  const bundler = browserify(browserifyOptions);
  bundler.add(src);
  // Run TypeScript files through Babel
  bundler.transform('babelify', { extensions });
  // Inline `fs.readFileSync` files
  bundler.transform('brfs');

  const bundleStream = bundler.bundle();
  bundleStream.pipe(fs.createWriteStream(dest));
  bundleStream.on('error', (error: unknown) => {
    console.error(`Couldn't compile scripts: ${error}`);
  });
  await pify(endOfStream(bundleStream));

  console.log(
    `- Compiled scripts: ${path.relative(
      PROJECT_DIRECTORY_PATH,
      src,
    )} -> ${path.relative(PROJECT_DIRECTORY_PATH, dest)}`,
  );
}

/**
 * Compiles the CSS code for the dashboard.
 *
 * @param src - The path to the CSS file.
 * @param dest - The path to the compiled CSS file.
 */
async function compileStylesheets(src: string, dest: string): Promise<void> {
  await promisifiedPump(
    gulp.src(src),
    sourcemaps.init(),
    gulpSass(sass)().on('error', (error: unknown) => {
      console.error(`Couldn't compile stylesheets: ${error}`);
    }),
    autoprefixer(),
    sourcemaps.write(),
    gulp.dest(dest),
  );
  console.log(
    `- Compiled stylesheets: ${path.relative(
      PROJECT_DIRECTORY_PATH,
      src,
    )} -> ${path.relative(PROJECT_DIRECTORY_PATH, dest)}`,
  );
}

/**
 * Copies static files (images and the index HTML file) to the build directory.
 *
 * @param src - The path to the directory that holds the static files.
 * @param dest - The path where they should be copied.
 */
async function copyStaticFiles(src: string, dest: string): Promise<void> {
  const entries = await fg([path.join(src, '*')], {
    onlyFiles: false,
  });
  await Promise.all(
    entries.map(async (srcEntry) => {
      const destEntry = path.join(dest, path.basename(srcEntry));
      await fs.copy(srcEntry, destEntry);
      console.log(
        `- Copied static files: ${path.relative(
          PROJECT_DIRECTORY_PATH,
          srcEntry,
        )} -> ${path.relative(PROJECT_DIRECTORY_PATH, destEntry)}`,
      );
    }),
  );
}

/**
 * Generates a compiled and bundled version of the dashboard ready for
 * distribution.
 *
 * @param options - The options.
 * @param options.isInitial - Whether this is the first time this function has
 * been called (if we are watching for file changes, we may call this function
 * multiple times).
 */
async function rebuild({ isInitial = false } = {}): Promise<void> {
  if (isInitial) {
    console.log('Building dependency tree, hang tight...');
  }

  if (!isInitial) {
    console.log('Detected change, rebuilding...');
  }

  await fs.emptyDir(FINAL_BUILD_DIRECTORY_PATH);

  if (isInitial) {
    await generateIntermediateFiles();
  }

  await compileScripts(
    path.join(APP_DIRECTORY_PATH, 'index.tsx'),
    path.join(FINAL_BUILD_DIRECTORY_PATH, 'index.js'),
  );
  await compileStylesheets(
    path.join(APP_DIRECTORY_PATH, 'index.scss'),
    FINAL_BUILD_DIRECTORY_PATH,
  );
  await copyStaticFiles(
    path.join(APP_DIRECTORY_PATH, 'public'),
    FINAL_BUILD_DIRECTORY_PATH,
  );
}

/**
 * The entrypoint to this script. Parses command-line arguments, then, depending
 * on whether `--watch` was given, either starts a file watcher, after which the
 * dashboard will be built on file changes, or builds the dashboard immediately.
 */
async function main() {
  const opts = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('watch', {
      alias: 'w',
      type: 'boolean',
      description: 'Automatically build when there are changes',
    })
    .help('h')
    .alias('h', 'help')
    .parseSync();

  console.log(`Working directory: ${PROJECT_DIRECTORY_PATH}`);

  if (opts.watch) {
    const rebuildIgnoringErrors = () => {
      rebuild().catch((error: unknown) => {
        console.error(error);
      });
    };
    chokidar
      .watch(
        [
          path.join(COMMON_DIRECTORY_PATH, '**/*.{html,ts,tsx,scss}'),
          path.join(APP_DIRECTORY_PATH, '**/*.{html,ts,tsx,scss}'),
        ],
        {
          ignoreInitial: true,
        },
      )
      .on('add', rebuildIgnoringErrors)
      .on('change', rebuildIgnoringErrors)
      .on('unlink', rebuildIgnoringErrors)
      .on('error', (error: unknown) => {
        console.error(error);
      });
  }

  await rebuild({ isInitial: true });
}
