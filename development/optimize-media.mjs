import { writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import imagemin from 'imagemin';
import imageminGifsicle from 'imagemin-gifsicle';
import globby from 'globby';

/**
 * Images the optimizer shouldn't modify for whatever reason. Paths must
 * be relative to the project root.
 *
 * @type {string[]}
 */
const blocklist = [];

/**
 * Supported file formats by the optimizer (sharp)
 *
 * @type {string[]}
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

/**
 * Optimizes an image file if its format is supported and if optimization reduces file size.
 *
 * @param {string} filePath - Absolute path to the media file.
 * @returns {Promise<boolean>} Whether the media was optimized or not.
 */
async function optimizeImage(filePath) {
  try {
    const fileInfo = await sharp(filePath).metadata();

    if (supportedFileFormats.includes(fileInfo.format)) {
      const { size: originalSize } = await stat(filePath);
      /**
       * @type {Buffer | null}
       */
      let optimizedBuffer = null;
      if (fileInfo.format === 'gif') {
        // Gifsicle is better at optimizing gifs than sharp
        [{data: optimizedBuffer}] = await imagemin([filePath], {
          plugins: [imageminGifsicle({
            optimizationLevel: 3,
          })],
        });
      } else {
        optimizedBuffer = await sharp(filePath, {
          // default is `false`, which makes sharp only read the first frame of an animated image :facepalm:
          animated: true,
        })
          .toFormat(fileInfo.format, {
            jpegQuality: 100,
            animated: true,
            compressionLevel: 9,
            // 6 is max for webp,
            effort: fileInfo.format === "webp" ? 6 : 10,
            reuse: false,
            quality: 100,
            lossless: true,
            webpLossless: true,
          })
          .toBuffer(`${filePath}`);
      }

      if (optimizedBuffer.byteLength < originalSize) {
        // if we saved some bytes, write the optimized image back to disk
        await writeFile(filePath, optimizedBuffer);
        console.log(
          `Optimized ${filePath}: Reduced size by ${(
            (1 - optimizedBuffer.byteLength / originalSize) *
            100
          ).toFixed(2)}%`,
        );
        return true;
      }
    } else {
      console.warn(
        `Unsupported file format for ${filePath}. Skipping optimization.`,
      );
    }
  } catch (error) {
    console.error(`Failed to process ${filePath}: ${error.message}`);
  }
  return false;
}

/**
 * Optimize all media files in the project root, except those in the blocklist.
 *
 * @param {string[]} blocklist - List of files to be excluded from optimization. Paths must be relative to the project root.
 * @returns {Promise<{ optimizedCount: number, filesCount: number }>}
 */
async function optimizeImages(blocklist) {
  const projectRoot = resolve(import.meta.dirname, '../');
  const glob = `**/*.{${supportedFileFormats.join(',')}}`;
  /**
   * @type {globby.GlobbyOptions}
   */
  const options = {
    cwd: projectRoot,
    gitignore: true,
    ignore: blocklist,
  };
  const filePaths = await globby(glob, options);
  const tasks = filePaths.map((file) => optimizeImage(join(projectRoot, file)));
  const results = await Promise.all(tasks);
  const optimizedCount = results.filter((isOptimized) => isOptimized).length;

  return { optimizedCount, filesCount: filePaths.length };
}

const results = await optimizeImages(blocklist);
console.log(
  `Optimization completed: ${results.optimizedCount} out of ${results.filesCount} files optimized.`,
);

if (results.optimizedCount > 0) {
  console.log(
    'Check accuracy of the optimized images and commit the changes if they look good.',
  );
}
