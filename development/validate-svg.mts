import { readFile } from 'node:fs/promises';

// Detect data URIs on SVG <image> elements. The media type is captured so
// embedded SVGs can remain valid while raster images are rejected.
const svgDataUriPattern =
  /<(?:[\w-]+:)?image\b[^>]*\b(?:href|xlink:href)\s*=\s*(['"])data:([^;,\s]+)(?:;[^,\s]*)?,/gi;

/**
 * Ensures an SVG does not contain embedded binary media.
 *
 * @param filePath - Absolute path to the SVG file read from disk.
 * @param displayPath - Project-relative path included in validation errors.
 * @throws If the SVG embeds a non-SVG data URI.
 */
export async function validateSvg(
  filePath: string,
  displayPath = filePath,
): Promise<void> {
  const svg = await readFile(filePath, 'utf8');
  const matches = svg.matchAll(svgDataUriPattern);

  for (const match of matches) {
    const mediaType = match[2].toLowerCase();
    if (mediaType !== 'image/svg+xml') {
      throw new Error(
        `${displayPath} embeds binary ${mediaType} data in an SVG. ` +
          'Either find/create a real SVG, or extract the PNG from inside the SVG (ImageMagick can do this in most cases).',
      );
    }
  }
}
