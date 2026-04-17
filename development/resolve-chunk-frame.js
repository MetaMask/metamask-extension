#!/usr/bin/env node
/**
 * Map a line/column in a Browserify chunk (e.g. common-8.js) to the original
 * source file using source maps. Resolution order:
 *
 * 1. dist/sourcemaps/<file>.map — production / test / dist-style builds
 * 2. dist/<platform>/<file>.map — sibling map if present
 * 3. Inline base64 map at the end of dist/<platform>/<file>.js — `yarn start`
 *    dev builds (see development/build/scripts.js setupSourcemaps).
 *
 * Usage:
 *   yarn resolve-chunk-frame chrome common-8.js 13325 39
 *   yarn resolve-chunk-frame firefox background-2.js 1200 15
 */

const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');

/**
 * @param {string} platform - e.g. chrome
 * @param {string} file - e.g. common-8.js
 * @returns {string | null} Raw JSON for the source map
 */
function loadRawSourceMapJson(platform, file) {
  const repoRoot = path.join(__dirname, '..');
  const distPlatform = path.join(repoRoot, 'dist', platform);
  const sourcemapsDir = path.join(repoRoot, 'dist', 'sourcemaps');
  const pathsTried = [];

  const externalMapInSourcemaps = path.join(sourcemapsDir, `${file}.map`);
  pathsTried.push(externalMapInSourcemaps);
  if (fs.existsSync(externalMapInSourcemaps)) {
    return fs.readFileSync(externalMapInSourcemaps, 'utf8');
  }

  const siblingMap = path.join(distPlatform, `${file}.map`);
  pathsTried.push(siblingMap);
  if (fs.existsSync(siblingMap)) {
    return fs.readFileSync(siblingMap, 'utf8');
  }

  const jsPath = path.join(distPlatform, file);
  pathsTried.push(jsPath);
  if (fs.existsSync(jsPath)) {
    const js = fs.readFileSync(jsPath, 'utf8');
    const inline = extractInlineSourceMapJson(js);
    if (inline !== null) {
      return inline;
    }
  }

  console.error('Could not find a source map. Checked:', pathsTried.join(', '));
  console.error(
    'Build the extension first (e.g. yarn start or yarn dist). Dev builds embed the map at the end of the .js file.',
  );
  return null;
}

/**
 * Dev builds append `//# sourceMappingURL=data:application/json;...;base64,...`.
 *
 * @param {string} jsContent - Bundle source
 * @returns {string | null}
 */
function extractInlineSourceMapJson(jsContent) {
  const marker = '//# sourceMappingURL=';
  const idx = jsContent.lastIndexOf(marker);
  if (idx === -1) {
    return null;
  }
  const line = jsContent.slice(idx).split('\n')[0];
  const dataUrl = line.slice(marker.length).trim();
  if (!dataUrl.startsWith('data:')) {
    return null;
  }
  const base64Match = dataUrl.match(/base64,(.+)/u);
  if (base64Match === null) {
    return null;
  }
  return Buffer.from(base64Match[1], 'base64').toString('utf8');
}

async function main() {
  const args = process.argv.slice(2);
  const platform = args[0];
  const file = args[1];
  const line = args[2];
  const col = args[3];

  if (!platform || !file || !line || !col) {
    console.error(
      'Usage: yarn resolve-chunk-frame <platform> <chunk-file.js> <line> <column>',
    );
    console.error(
      'Example: yarn resolve-chunk-frame chrome common-8.js 13325 39',
    );
    process.exit(1);
  }

  const rawMap = loadRawSourceMapJson(platform, file);
  if (rawMap === null) {
    process.exit(1);
  }
  const consumer = await new SourceMapConsumer(JSON.parse(rawMap));

  const lineNum = Number.parseInt(line, 10);
  const colNum = Number.parseInt(col, 10);

  /** @type {import('source-map').NullableMappedPosition} */
  let result = consumer.originalPositionFor({
    line: lineNum,
    column: colNum,
  });

  if (!result.source) {
    result = consumer.originalPositionFor({
      line: lineNum,
      column: Math.max(0, colNum - 1),
    });
  }

  console.log('Source map lookup result:', JSON.stringify(result, null, 2));

  if (result.source) {
    console.log(`\nOriginal file: ${result.source}`);
    console.log(`Line: ${result.line}, column: ${result.column}`);
    const pkg = packageHintFromSourcePath(result.source);
    if (pkg) {
      console.log(`\nLikely npm package (from path): ${pkg}`);
    }
  } else {
    console.error(
      '\nCould not resolve an original position. Try the neighboring column (e.g. column-1); Chrome stack columns are sometimes off by one.',
    );
  }

  consumer.destroy();
}

/**
 * @param {string} sourcePath
 * @returns {string | null}
 */
function packageHintFromSourcePath(sourcePath) {
  const m = sourcePath.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/u);
  return m ? `node_modules/${m[1]}` : null;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
