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
import gulpDartSass from 'gulp-dart-sass';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';
import fg from 'fast-glob';
import buildModulePartitions from './build-module-partitions';

const promisifiedPump = pify(pump);
const projectDirectoryPath = path.resolve(__dirname, '../');
const sourceDirectoryPath = path.join(projectDirectoryPath, 'src');
const intermediateDirectoryPath = path.join(
  projectDirectoryPath,
  'intermediate',
);
const buildDirectoryPath = path.join(projectDirectoryPath, 'build');

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Compiles a set of files that we want to convert to TypeScript, divided by
 * level in the dependency tree.
 *
 * @param dest - The directory in which to hold the file.
 */
async function generateIntermediateFiles(dest: string) {
  const partitions = await buildModulePartitions();
  const partitionsFile = path.resolve(dest, 'partitions.json');
  await pify(fs.writeFile)(
    partitionsFile,
    JSON.stringify(partitions, null, '  '),
  );

  console.log(
    `- Wrote intermediate partitions file: ${path.relative(
      projectDirectoryPath,
      partitionsFile,
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
  bundleStream.on('error', (error: Error) => {
    throw error;
  });
  await pify(endOfStream(bundleStream));

  console.log(
    `- Compiled scripts: ${path.relative(
      projectDirectoryPath,
      src,
    )} -> ${path.relative(projectDirectoryPath, dest)}`,
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
    gulpDartSass().on('error', (error: unknown) => {
      throw error;
    }),
    autoprefixer(),
    sourcemaps.write(),
    gulp.dest(dest),
  );
  console.log(
    `- Compiled stylesheets: ${path.relative(
      projectDirectoryPath,
      src,
    )} -> ${path.relative(projectDirectoryPath, dest)}`,
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
          projectDirectoryPath,
          srcEntry,
        )} -> ${path.relative(projectDirectoryPath, destEntry)}`,
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
 * @param options.isOnly - Whether this will be the only time this function will
 * be called (if we are not watching for file changes, then this will never be
 * called again).
 */
async function rebuild({
  isInitial = false,
  isOnly = false,
} = {}): Promise<void> {
  if (isInitial && !isOnly) {
    console.log('Running initial build, please wait (may take a bit)...');
  }

  if (!isInitial) {
    console.log('Detected change, rebuilding...');
  }

  await fs.emptyDir(buildDirectoryPath);

  try {
    if (isInitial) {
      await fs.emptyDir(intermediateDirectoryPath);
      await generateIntermediateFiles(intermediateDirectoryPath);
    }

    await compileScripts(
      path.join(sourceDirectoryPath, 'index.tsx'),
      path.join(buildDirectoryPath, 'index.js'),
    );
    await compileStylesheets(
      path.join(sourceDirectoryPath, 'index.scss'),
      path.join(buildDirectoryPath),
    );
    await copyStaticFiles(
      path.join(sourceDirectoryPath, 'public'),
      path.join(buildDirectoryPath),
    );
  } catch (error: unknown) {
    console.error(error);
  }
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

  console.log(`Working directory: ${projectDirectoryPath}`);

  if (opts.watch) {
    const rebuildIgnoringErrors = () => {
      rebuild().catch((error: Error) => {
        console.error(error);
      });
    };
    chokidar
      .watch(path.join(sourceDirectoryPath, '**/*.{html,ts,tsx,scss}'), {
        ignoreInitial: true,
      })
      .on('add', rebuildIgnoringErrors)
      .on('change', rebuildIgnoringErrors)
      .on('unlink', rebuildIgnoringErrors)
      .on('error', (error: unknown) => {
        console.error(error);
      });
    await rebuild({ isInitial: true, isOnly: false });
  } else {
    await rebuild({ isInitial: true, isOnly: true });
  }
}
