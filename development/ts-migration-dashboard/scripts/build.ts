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
import buildModulePartitions from './buildModulePartitions';

const promisifiedPump = pify(pump);
const projectDirectoryPath = path.resolve(__dirname, '../');
const sourceDirectoryPath = path.join(projectDirectoryPath, 'src');
const intermediateDirectoryPath = path.join(
  projectDirectoryPath,
  'intermediate',
);
const buildDirectoryPath = path.join(projectDirectoryPath, 'build');

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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
