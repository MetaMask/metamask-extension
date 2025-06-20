import { writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { argv, exit } from 'node:process';
import sharp from 'sharp';
import imagemin from 'imagemin';
import imageminGifsicle from 'imagemin-gifsicle';
import globby from 'globby';
import yargs from 'yargs/yargs';

/**
 * Images the optimizer shouldn't modify for whatever reason. Paths must
 * be relative to the project root.
 */
const blocklist = [
  // test files are typically generated; optimizing them will cause developer
  // annoyance
  'test/**/*',
  // too big to optimize
  'docs/assets/sentry-cli-release-process.gif',
];

/**
 * Supported file formats by the optimizer (sharp)
 */
const supportedFileFormats = [
  'heic',
  'heif',
  'avif',
  'jpeg',
  'jpg',
  'jpe',
  'tile',
  'dz',
  'png',
  'raw',
  'tiff',
  'tif',
  'webp',
  'gif',
  'jp2',
  'jpx',
  'j2k',
  'j2c',
  'jxl',
];

type SupportedSharpFileOptions =
  | sharp.OutputOptions
  | sharp.JpegOptions
  | sharp.PngOptions
  | sharp.WebpOptions
  | sharp.AvifOptions
  | sharp.HeifOptions
  | sharp.JxlOptions
  | sharp.Jp2Options
  | sharp.TiffOptions;

/**
 * Optimizes an image file if its format is supported and if optimization reduces file size.
 *
 * @param filePath - Absolute path to the media file.
 * @param fix - If true, the function will write the optimized image back to disk.
 * @returns Whether the media was optimized or not.
 */
async function optimizeImage(filePath: string, fix = true) {
  try {
    const fileInfo = await sharp(filePath).metadata();
    if (!fileInfo || !fileInfo.format) {
      console.warn(
        `Could not retrieve metadata for ${filePath}. Skipping file.`,
      );
      return { changed: false, filePath };
    }

    if (supportedFileFormats.includes(fileInfo.format)) {
      const { size: originalSize } = await stat(filePath);
      let optimizedBuffer: Buffer | null = null;
      if (fileInfo.format === 'gif') {
        // Gifsicle is usually better at optimizing GIFs than sharp
        [{ data: optimizedBuffer }] = await imagemin([filePath], {
          plugins: [
            imageminGifsicle({
              optimizationLevel: 3,
            }),
          ],
        });
      } else {
        optimizedBuffer = await sharp(filePath, {
          // default is `false`, which makes sharp only read the first frame of
          // an animated image :facepalm:
          animated: true,
        })
          .toFormat(fileInfo.format, {
            compressionLevel: 9,
            // 6 is max for webp,
            effort: fileInfo.format === 'webp' ? 6 : 10,
            quality: 100,
            lossless: true,
          } satisfies SupportedSharpFileOptions)
          .toBuffer();
      }

      if (optimizedBuffer.byteLength < originalSize) {
        // if we saved some bytes, write the optimized image back to disk
        if (fix) {
          await writeFile(filePath, optimizedBuffer);
        }
        console.log(
          `Optimized ${filePath}: Reduced size by ${(
            (1 - optimizedBuffer.byteLength / originalSize) *
            100
          ).toFixed(2)}%`,
        );
        return { changed: true, filePath };
      }
    } else {
      console.warn(
        `Unsupported file format for ${filePath}. Skipping optimization.`,
      );
    }
  } catch (error) {
    console.error(`Failed to process ${filePath}: ${(error as Error).message}`);
  }
  return { changed: false, filePath };
}

/**
 * Optimize all media files in the project root, except those in the blocklist.
 *
 * @param options - List of files to be excluded from optimization. Paths must be relative to the project root.
 * @param options.blocklist - Array of file paths to exclude from optimization.
 * @param options.fix - If true, the function will automatically fix issues by optimizing images.
 */
export async function optimizeImages({
  blocklist,
  fix,
}: {
  blocklist?: string[];
  fix?: boolean;
}) {
  // set defaults
  blocklist = blocklist || [];
  fix = fix || false;

  const projectRoot = resolve(import.meta.dirname, '../');
  const glob = `**/*.{${supportedFileFormats.join(',')}}`;
  const options = {
    cwd: projectRoot,
    gitignore: true,
    ignore: blocklist,
  };
  const filePaths = await globby(glob, options);
  const tasks = filePaths.map((file) =>
    optimizeImage(join(projectRoot, file), fix),
  );
  const results = await Promise.all(tasks);
  let optimizedFiles = results.filter(({ changed }) => changed);
  const optimizedCount = optimizedFiles.length;

  // keep running optimizeImage recursively until it doesn't optimize the files
  // any further
  if (fix && optimizedCount > 0) {
    while (true) {
      optimizedFiles = await Promise.all(
        optimizedFiles.map((file) => optimizeImage(file.filePath, fix)),
      );
      const newOptimizedCount = optimizedFiles.filter(
        ({ changed }) => changed,
      ).length;
      if (newOptimizedCount === 0) {
        break; // no more files were optimized, exit the loop
      }
    }
  }

  return { optimizedCount, filesCount: filePaths.length };
}

export async function main() {
  // get the --fix option from the args
  const { fix } = yargs()
    .strict()
    .option('fix', {
      alias: 'f',
      type: 'boolean',
      description: 'Automatically optimize images',
      default: false,
    })
    .parseSync(argv.slice(2));

  const results = await optimizeImages({ blocklist, fix });

  console.log(
    `Optimization completed: ${results.optimizedCount} out of ${
      results.filesCount
    } file${results.filesCount === 1 ? '' : 's'} were able to be optimized.`,
  );

  if (results.optimizedCount > 0) {
    if (fix) {
      console.log(
        'Verify accuracy and quality of optimized images before commit changes.',
      );
    } else {
      console.error(
        'Run `yarn lint:images:fix` to automatically optimize the images.',
      );
      // error out if --fix is not set and some files were able to be optimized
      exit(1);
    }
  }
}

main().catch((error) => {
  console.error(`Error during optimization: ${(error as Error).message}`);
  exit(1);
});
