#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');
const pify = require('pify');
const { codeFrameColumns } = require('@babel/code-frame');

const fsAsync = pify(fs);

//
// Utility to help check if sourcemaps are working
//
// searches `dist/chrome/scripts/inpage.js` for "new Error" statements
// and prints their source lines using the sourcemaps.
// if not working it may error or print minified garbage
//

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function start() {
  const targetFiles = [
    `common-0.js`,
    `background-0.js`,
    `ui-0.js`,
    `scripts/contentscript.js`,
    // `scripts/inpage.js`, skipped because the validator can't sample the inlined `scripts/inpage.js` script
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
        const location = {
          start: { line: position.line, column: position.column + 1 },
        };
        const codeSample = codeFrameColumns(rawBuild, location, {
          message: `missing source for position`,
          highlightCode: true,
        });
        console.error(
          `missing source for position, in bundle "${buildName}"\n${codeSample}`,
        );
        return;
      }
      const sourceContent = consumer.sourceContentFor(result.source);
      const sourceLines = sourceContent.split('\n');
      const sourceLine = sourceLines[result.line - 1];
      // this sometimes includes the whole line though we tried to match somewhere in the middle
      const portion = sourceLine.slice(result.column);
      const foundValidSource = portion.includes(targetString);
      if (!foundValidSource) {
        valid = false;
        const location = {
          start: { line: result.line + 1, column: result.column + 1 },
        };
        const codeSample = codeFrameColumns(sourceContent, location, {
          message: `expected to see ${JSON.stringify(targetString)}`,
          highlightCode: true,
        });
        console.error(
          `Sourcemap seems invalid, ${result.source}\n${codeSample}`,
        );
      }
    });
  });
  console.log(`  checked ${sampleCount} samples`);
  return valid;
}

function indicesOf(substring, string) {
  const a = [];
  let i = -1;
  while ((i = string.indexOf(substring, i + 1)) >= 0) {
    a.push(i);
  }
  return a;
}
