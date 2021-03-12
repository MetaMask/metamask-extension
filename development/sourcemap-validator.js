const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');
const pify = require('pify');

const fsAsync = pify(fs);

//
// Utility to help check if sourcemaps are working
//
// searches `dist/chrome/inpage.js` for "new Error" statements
// and prints their source lines using the sourcemaps.
// if not working it may error or print minified garbage
//

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function start() {
  const targetFiles = [
    `background.js`,
    // `bg-libs`, skipped because source maps are invalid due to browserify bug: https://github.com/browserify/browserify/issues/1971
    // `contentscript.js`, skipped because the validator is erroneously sampling the inlined `inpage.js` script
    `inpage.js`,
    'phishing-detect.js',
    `ui.js`,
    // `ui-libs.js`, skipped because source maps are invalid due to browserify bug: https://github.com/browserify/browserify/issues/1971
  ];
  let valid = true;

  for (const buildName of targetFiles) {
    const fileIsValid = await validateSourcemapForFile({ buildName });
    valid = valid && fileIsValid;
  }

  if (!valid) {
    process.exit(1);
  }
}

async function validateSourcemapForFile({ buildName }) {
  console.log(`build "${buildName}"`);
  const platform = `chrome`;
  // load build and sourcemaps
  let rawBuild;
  try {
    const filePath = path.join(
      __dirname,
      `/../dist/${platform}/`,
      `${buildName}`,
    );
    rawBuild = await fsAsync.readFile(filePath, 'utf8');
  } catch (_) {
    // empty
  }
  if (!rawBuild) {
    throw new Error(
      `SourcemapValidator - failed to load source file for "${buildName}"`,
    );
  }
  // attempt to load in dist mode
  let rawSourceMap;
  try {
    const filePath = path.join(
      __dirname,
      `/../dist/sourcemaps/`,
      `${buildName}.map`,
    );
    rawSourceMap = await fsAsync.readFile(filePath, 'utf8');
  } catch (_) {
    // empty
  }
  // attempt to load in dev mode
  try {
    const filePath = path.join(
      __dirname,
      `/../dist/${platform}/`,
      `${buildName}.map`,
    );
    rawSourceMap = await fsAsync.readFile(filePath, 'utf8');
  } catch (_) {
    // empty
  }
  if (!rawSourceMap) {
    throw new Error(
      `SourcemapValidator - failed to load sourcemaps for "${buildName}"`,
    );
  }

  const consumer = await new SourceMapConsumer(rawSourceMap);

  const hasContentsOfAllSources = consumer.hasContentsOfAllSources();
  if (!hasContentsOfAllSources) {
    console.warn('SourcemapValidator - missing content of some sources...');
  }

  console.log(`  sampling from ${consumer.sources.length} files`);
  let sampleCount = 0;
  let valid = true;

  const buildLines = rawBuild.split('\n');
  const targetString = 'new Error';
  // const targetString = 'null'
  const matchesPerLine = buildLines.map((line) =>
    indicesOf(targetString, line),
  );
  matchesPerLine.forEach((matchIndices, lineIndex) => {
    matchIndices.forEach((matchColumn) => {
      sampleCount += 1;
      const position = { line: lineIndex + 1, column: matchColumn };
      const result = consumer.originalPositionFor(position);
      // warn if source content is missing
      if (!result.source) {
        valid = false;
        console.warn(
          `!! missing source for position: ${JSON.stringify(position)}`,
        );
        // const buildLine = buildLines[position.line - 1]
        console.warn(`   origin in build:`);
        console.warn(`   ${buildLines[position.line - 2]}`);
        console.warn(`-> ${buildLines[position.line - 1]}`);
        console.warn(`   ${buildLines[position.line - 0]}`);
        return;
      }
      const sourceContent = consumer.sourceContentFor(result.source);
      const sourceLines = sourceContent.split('\n');
      const line = sourceLines[result.line - 1];
      // this sometimes includes the whole line though we tried to match somewhere in the middle
      const portion = line.slice(result.column);
      const isMaybeValid = portion.includes(targetString);
      if (!isMaybeValid) {
        valid = false;
        console.error(
          `Sourcemap seems invalid:\n${getFencedCode(result.source, line)}`,
        );
      }
    });
  });
  console.log(`  checked ${sampleCount} samples`);
  return valid;
}

const CODE_FENCE_LENGTH = 80;
const TITLE_PADDING_LENGTH = 1;

function getFencedCode(filename, code) {
  const title = `${' '.repeat(TITLE_PADDING_LENGTH)}${filename}${' '.repeat(
    TITLE_PADDING_LENGTH,
  )}`;
  const openingFenceLength = Math.max(
    CODE_FENCE_LENGTH - (filename.length + TITLE_PADDING_LENGTH * 2),
    0,
  );
  const startOpeningFenceLength = Math.floor(openingFenceLength / 2);
  const endOpeningFenceLength = Math.ceil(openingFenceLength / 2);
  const openingFence = `${'='.repeat(
    startOpeningFenceLength,
  )}${title}${'='.repeat(endOpeningFenceLength)}`;
  const closingFence = '='.repeat(CODE_FENCE_LENGTH);

  return `${openingFence}\n${code}\n${closingFence}\n`;
}

function indicesOf(substring, string) {
  const a = [];
  let i = -1;
  while ((i = string.indexOf(substring, i + 1)) >= 0) {
    a.push(i);
  }
  return a;
}
