import { describe, it, afterEach, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { SourceMapGenerator } from 'source-map';
import {
  isLikelyCommentLine,
  isLikelyMinifiedLine,
  indicesOf,
  discoverWebpackBundles,
  validateBundle,
  main,
} from '../sourcemap-validator';

const noop = () => undefined;

const FIXTURES_DIR = join(__dirname, 'fixtures');
const EMPTY_FIXTURE = join(FIXTURES_DIR, 'sourcemap-validator-empty');
const DIST_FIXTURE = join(FIXTURES_DIR, 'sourcemap-validator-dist');

describe('sourcemap-validator', () => {
  afterEach(() => mock.restoreAll());

  describe('isLikelyCommentLine', () => {
    it('returns true for JSDoc line starting with *', () => {
      assert.strictEqual(isLikelyCommentLine(' * foo'), true);
      assert.strictEqual(isLikelyCommentLine('* _.isError(new Error);'), true);
    });

    it('returns true for line comment', () => {
      assert.strictEqual(isLikelyCommentLine('// comment'), true);
      assert.strictEqual(isLikelyCommentLine('  // bar'), true);
    });

    it('returns true for block comment start/end', () => {
      assert.strictEqual(isLikelyCommentLine('/*'), true);
      assert.strictEqual(isLikelyCommentLine('*/'), true);
    });

    it('returns true for empty or whitespace-only line', () => {
      assert.strictEqual(isLikelyCommentLine(''), true);
      assert.strictEqual(isLikelyCommentLine('   '), true);
      assert.strictEqual(isLikelyCommentLine('\t'), true);
    });

    it('returns false for code lines', () => {
      assert.strictEqual(isLikelyCommentLine('throw new Error("x");'), false);
      assert.strictEqual(isLikelyCommentLine('const x = 1;'), false);
      assert.strictEqual(isLikelyCommentLine('  return new Error();'), false);
    });
  });

  describe('isLikelyMinifiedLine', () => {
    it('returns false for short lines', () => {
      assert.strictEqual(isLikelyMinifiedLine('throw new Error("x");'), false);
      assert.strictEqual(isLikelyMinifiedLine('a'.repeat(500)), false);
    });

    it('returns true for lines longer than threshold', () => {
      assert.strictEqual(isLikelyMinifiedLine('x'.repeat(1001)), true);
    });
  });

  describe('indicesOf', () => {
    it('returns empty array when substring not found', () => {
      assert.deepStrictEqual(indicesOf('x', 'abc'), []);
      assert.deepStrictEqual(indicesOf('new Error', ''), []);
    });

    it('returns single index when one match', () => {
      assert.deepStrictEqual(indicesOf('new Error', 'throw new Error()'), [6]);
      assert.deepStrictEqual(indicesOf('a', 'a'), [0]);
    });

    it('returns multiple indices when multiple matches', () => {
      assert.deepStrictEqual(
        indicesOf('new Error', 'new Error and new Error'),
        [0, 14],
      );
      assert.deepStrictEqual(indicesOf('aa', 'aaa'), [0, 1]);
      assert.deepStrictEqual(indicesOf('aa', 'aabaa'), [0, 3]);
    });
  });

  describe('discoverWebpackBundles', () => {
    // With cwd = DIST_FIXTURE, discoverWebpackBundles() scans dist/chrome and
    // asserts on labels. Required fixtures: background.abc123.js+.map (label
    // includes 'background'), ui.def456.js+.map ('ui'), scripts/contentscript.js+.map ('contentscript').
    it('returns empty array when dist/chrome does not exist', async () => {
      mock.method(process, 'cwd', () => EMPTY_FIXTURE, { times: Infinity });
      const pairs = await discoverWebpackBundles();
      assert.strictEqual(pairs.length, 0);
    });

    it('finds .js files that have a .map sibling', async () => {
      mock.method(process, 'cwd', () => DIST_FIXTURE, { times: Infinity });
      const pairs = await discoverWebpackBundles();
      assert.ok(pairs.length >= 2);
      assert.ok(pairs.some((p) => p.label.includes('background')));
      assert.ok(pairs.some((p) => p.label.includes('ui')));
      const background = pairs.find((p) => p.label.includes('background'));
      assert.ok(background);
      assert.strictEqual(background?.mapPath, `${background?.jsPath}.map`);
    });

    it('scans subdirectories (e.g. scripts/)', async () => {
      mock.method(process, 'cwd', () => DIST_FIXTURE, { times: Infinity });
      const pairs = await discoverWebpackBundles();
      assert.ok(pairs.some((p) => p.label.includes('contentscript')));
    });
  });

  describe('validateBundle', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await mkdtemp(join(tmpdir(), 'sourcemap-validator-test-'));
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    function makeSourceMap(
      sourceContent: string,
      generatedLine: number,
      generatedColumn: number,
      originalLine: number,
      originalColumn: number,
    ): string {
      const gen = new SourceMapGenerator({ file: 'out.js' });
      gen.setSourceContent('src.ts', sourceContent);
      gen.addMapping({
        generated: { line: generatedLine, column: 0 },
        source: 'src.ts',
        original: { line: originalLine, column: 0 },
      });
      gen.addMapping({
        generated: { line: generatedLine, column: generatedColumn },
        source: 'src.ts',
        original: { line: originalLine, column: originalColumn },
      });
      return JSON.stringify(gen.toJSON());
    }

    it('returns false when JS file cannot be read', async () => {
      mock.method(console, 'error', noop);
      mock.method(console, 'log', noop);
      const ok = await validateBundle({
        jsPath: join(tmpDir, 'nonexistent.js'),
        mapPath: join(tmpDir, 'nonexistent.js.map'),
        label: 'nonexistent.js',
      });
      assert.strictEqual(ok, false);
    });

    it('returns false when map file cannot be read', async () => {
      const jsPath = join(tmpDir, 'valid-only.js');
      await writeFile(jsPath, 'throw new Error("x");');
      mock.method(console, 'error', noop);
      mock.method(console, 'log', noop);
      const ok = await validateBundle({
        jsPath,
        mapPath: join(tmpDir, 'valid-only.js.map.nonexistent'),
        label: 'valid-only.js',
      });
      assert.strictEqual(ok, false);
    });

    it('returns true when bundle and map are valid and "new Error" maps correctly', async () => {
      const bundle = [
        '(function(module, exports) {',
        '  if (!state.initialized) {',
        '    throw new Error("Wallet not initialized");',
        '  }',
        '  return getAccounts();',
        '})',
      ].join('\n');
      const sourceContent = [
        'function ensureInitialized(state) {',
        '  if (!state.initialized) {',
        '    throw new Error("Wallet not initialized");',
        '  }',
        '  return getAccounts();',
        '}',
      ].join('\n');
      const mapJson = makeSourceMap(sourceContent, 3, 9, 3, 9);
      const jsPath = join(tmpDir, 'valid-bundle.js');
      const mapPath = join(tmpDir, 'valid-bundle.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      mock.method(console, 'log', noop);
      mock.method(console, 'warn', noop);
      const ok = await validateBundle({
        jsPath,
        mapPath,
        label: 'valid-bundle.js',
      });
      assert.strictEqual(ok, true);
    });

    it('returns false when source map maps to source without "new Error" at that position', async () => {
      const bundle = [
        '(function() {',
        '  const err = validate();',
        '  if (err) throw new Error(err.message);',
        '  return result;',
        '})();',
      ].join('\n');
      const sourceContent = [
        'function handleResult() {',
        '  const err = validate();',
        '  if (err) return null;',
        '  return result;',
        '}',
      ].join('\n');
      const mapJson = makeSourceMap(sourceContent, 3, 16, 3, 16);
      const jsPath = join(tmpDir, 'invalid-bundle.js');
      const mapPath = join(tmpDir, 'invalid-bundle.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      mock.method(console, 'log', noop);
      mock.method(console, 'error', noop);
      mock.method(console, 'warn', noop);
      const ok = await validateBundle({
        jsPath,
        mapPath,
        label: 'invalid-bundle.js',
      });
      assert.strictEqual(ok, false);
    });

    it('returns false when sourceContentFor returns null', async () => {
      const bundle = 'throw new Error("x");';
      const gen = new SourceMapGenerator({ file: 'out.js' });
      gen.addMapping({
        generated: { line: 1, column: 6 },
        source: 'missing.ts',
        original: { line: 1, column: 6 },
      });
      const mapJson = JSON.stringify(gen.toJSON());
      const jsPath = join(tmpDir, 'no-source-content.js');
      const mapPath = join(tmpDir, 'no-source-content.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      mock.method(console, 'log', noop);
      mock.method(console, 'error', noop);
      mock.method(console, 'warn', noop);
      const ok = await validateBundle({
        jsPath,
        mapPath,
        label: 'no-source-content.js',
      });
      assert.strictEqual(ok, false);
    });

    it('returns false and logs when result.source is null for a code line (missing source for position)', async () => {
      const bundle = 'line1\n  throw new Error("x");\nline3';
      const gen = new SourceMapGenerator({ file: 'out.js' });
      gen.setSourceContent('src.ts', '  throw new Error("x");');
      gen.addMapping({
        generated: { line: 1, column: 0 },
        source: 'src.ts',
        original: { line: 1, column: 0 },
      });
      const mapJson = JSON.stringify(gen.toJSON());
      const jsPath = join(tmpDir, 'missing-source.js');
      const mapPath = join(tmpDir, 'missing-source.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      mock.method(console, 'log', noop);
      mock.method(console, 'error', noop);
      mock.method(console, 'warn', noop);
      const ok = await validateBundle({
        jsPath,
        mapPath,
        label: 'missing-source.js',
      });
      assert.strictEqual(ok, false);
    });

    it('skips long (minified) lines when result.source is null (no false failure)', async () => {
      const padding = 'x'.repeat(992);
      const bundle = padding + 'new Error("minified");';
      const gen = new SourceMapGenerator({ file: 'out.js' });
      // No mapping for position of "new Error" so result.source is null; long line is skipped
      const mapJson = JSON.stringify(gen.toJSON());
      const jsPath = join(tmpDir, 'minified-skip.js');
      const mapPath = join(tmpDir, 'minified-skip.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      mock.method(console, 'log', noop);
      mock.method(console, 'warn', noop);
      const ok = await validateBundle({
        jsPath,
        mapPath,
        label: 'minified-skip.js',
      });
      assert.strictEqual(ok, true);
    });

    it('skips comment lines when result.source is null (no false failure)', async () => {
      const bundle = [
        '/******/',
        '  * @example throw new Error("in comment")',
        '(function(module) {',
        '  throw new Error("real");',
        '})(this);',
      ].join('\n');
      const gen = new SourceMapGenerator({ file: 'out.js' });
      gen.setSourceContent(
        'src.ts',
        ['export function run() {', '  throw new Error("real");', '}'].join(
          '\n',
        ),
      );
      gen.addMapping({
        generated: { line: 4, column: 2 },
        source: 'src.ts',
        original: { line: 2, column: 2 },
      });
      gen.addMapping({
        generated: { line: 4, column: 9 },
        source: 'src.ts',
        original: { line: 2, column: 9 },
      });
      const mapJson = JSON.stringify(gen.toJSON());
      const jsPath = join(tmpDir, 'comment-skip.js');
      const mapPath = join(tmpDir, 'comment-skip.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      mock.method(console, 'log', noop);
      mock.method(console, 'warn', noop);
      const ok = await validateBundle({
        jsPath,
        mapPath,
        label: 'comment-skip.js',
      });
      assert.strictEqual(ok, true);
    });
  });

  describe('main', () => {
    it('exits with 1 when dist/chrome does not exist', async () => {
      mock.method(process, 'cwd', () => EMPTY_FIXTURE, { times: Infinity });
      const exitMock = mock.method(process, 'exit', noop as () => never);
      mock.method(console, 'error', noop);
      await main();
      assert.ok(exitMock.mock.calls.length >= 1);
      assert.strictEqual(exitMock.mock.calls[0].arguments[0], 1);
    });

    it('exits with 1 when dist/chrome exists but has no .js+.map pairs', async () => {
      const emptyChromeDir = await mkdtemp(
        join(tmpdir(), 'sourcemap-validator-empty-chrome-'),
      );
      await mkdir(join(emptyChromeDir, 'dist', 'chrome'), { recursive: true });
      mock.method(process, 'cwd', () => emptyChromeDir, { times: Infinity });
      const exitMock = mock.method(process, 'exit', noop as () => never);
      mock.method(console, 'error', noop);
      await main();
      await rm(emptyChromeDir, { recursive: true, force: true });
      assert.ok(exitMock.mock.calls.length >= 1);
      assert.strictEqual(exitMock.mock.calls[0].arguments[0], 1);
    });

    it('exits with 1 when at least one bundle fails validation', async () => {
      const failDir = await mkdtemp(
        join(tmpdir(), 'sourcemap-validator-main-fail-'),
      );
      const chromeDir = join(failDir, 'dist', 'chrome');
      await mkdir(chromeDir, { recursive: true });
      const bundle = 'throw new Error("x");';
      const gen = new SourceMapGenerator({ file: 'out.js' });
      gen.setSourceContent('wrong.ts', 'throw SomethingElse("x");');
      gen.addMapping({
        generated: { line: 1, column: 0 },
        source: 'wrong.ts',
        original: { line: 1, column: 0 },
      });
      gen.addMapping({
        generated: { line: 1, column: 6 },
        source: 'wrong.ts',
        original: { line: 1, column: 6 },
      });
      await writeFile(join(chromeDir, 'fail.js'), bundle);
      await writeFile(
        join(chromeDir, 'fail.js.map'),
        JSON.stringify(gen.toJSON()),
      );
      mock.method(process, 'cwd', () => failDir, { times: Infinity });
      const exitMock = mock.method(process, 'exit', noop as () => never);
      mock.method(console, 'log', noop);
      mock.method(console, 'error', noop);
      mock.method(console, 'warn', noop);
      await main();
      await rm(failDir, { recursive: true, force: true });
      assert.ok(exitMock.mock.calls.length >= 1);
      assert.strictEqual(exitMock.mock.calls[0].arguments[0], 1);
    });
  });
});
