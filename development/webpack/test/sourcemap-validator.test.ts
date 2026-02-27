import { describe, it, afterEach, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { SourceMapGenerator } from 'source-map';
import {
  isLikelyCommentLine,
  isInsideMultilineBlockComment,
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

    it('returns false when block comment is followed by code on the same line', () => {
      assert.strictEqual(
        isLikelyCommentLine('/* some comment */throw new Error("an error")'),
        false,
      );
      assert.strictEqual(
        isLikelyCommentLine('  /**/ throw new Error();'),
        false,
      );
    });
  });

  describe('isInsideMultilineBlockComment', () => {
    it('returns true for lines between /* and */', () => {
      const buildLines = [
        'if (x) {',
        '  /*',
        '\t\tthrow new Error("in comment");',
        '\t\ti = j;',
        '  */',
        '  doSomething();',
      ];
      assert.strictEqual(
        isInsideMultilineBlockComment(buildLines, 0),
        false,
        'line 0: before block',
      );
      assert.strictEqual(
        isInsideMultilineBlockComment(buildLines, 1),
        true,
        'line 1: opening /*',
      );
      assert.strictEqual(
        isInsideMultilineBlockComment(buildLines, 2),
        true,
        'line 2: inside block',
      );
      assert.strictEqual(
        isInsideMultilineBlockComment(buildLines, 3),
        true,
        'line 3: inside block',
      );
      assert.strictEqual(
        isInsideMultilineBlockComment(buildLines, 4),
        false,
        'line 4: closing */',
      );
      assert.strictEqual(
        isInsideMultilineBlockComment(buildLines, 5),
        false,
        'line 5: after block',
      );
    });

    it('returns false when block opens and closes on the same line', () => {
      const buildLines = ['/* comment */ throw new Error();'];
      assert.strictEqual(isInsideMultilineBlockComment(buildLines, 0), false);
    });

    it('returns false when there is no block comment', () => {
      const buildLines = ['throw new Error("x");', 'const a = 1;'];
      assert.strictEqual(isInsideMultilineBlockComment(buildLines, 0), false);
      assert.strictEqual(isInsideMultilineBlockComment(buildLines, 1), false);
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

    it('prints warning when bundle has no "new Error" (zero samples, nothing to validate)', async () => {
      const bundle = 'const x = 1; export { x };';
      const mapJson = makeSourceMap('const x = 1;', 1, 0, 1, 0);
      const jsPath = join(tmpDir, 'no-samples.js');
      const mapPath = join(tmpDir, 'no-samples.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      const errors: string[] = [];
      mock.method(console, 'log', noop);
      mock.method(console, 'warn', noop);
      mock.method(console, 'error', (...args: unknown[]) => {
        errors.push(args.map((a) => String(a)).join(' '));
      });
      await validateBundle({
        jsPath,
        mapPath,
        label: 'no-samples.js',
      });
      assert.ok(
        errors.some(
          (e) =>
            e.includes('nothing to validate') || e.includes('no "new Error"'),
        ),
        'should log that no samples were found',
      );
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

    it('returns false and logs when validation throws (catch block)', async () => {
      const bundle = 'throw new Error("x");';
      const mapJson = makeSourceMap('throw new Error("x");', 1, 6, 1, 6);
      const jsPath = join(tmpDir, 'throw-during-validate.js');
      const mapPath = join(tmpDir, 'throw-during-validate.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      mock.method(console, 'log', noop);
      mock.method(console, 'warn', noop);
      const errors: string[] = [];
      mock.method(console, 'error', (...args: unknown[]) => {
        errors.push(args.map((a) => String(a)).join(' '));
      });
      const { SourceMapConsumer } = await import('source-map');
      const tempConsumer = await new SourceMapConsumer(
        '{"version":3,"file":"","sources":[],"mappings":""}',
      );
      const consumerProto = Object.getPrototypeOf(tempConsumer);
      tempConsumer.destroy();
      mock.method(consumerProto, 'originalPositionFor', () => {
        throw new Error('mock validation error');
      });
      const ok = await validateBundle({
        jsPath,
        mapPath,
        label: 'throw-during-validate.js',
      });
      assert.strictEqual(ok, false);
      const out = errors.join('\n');
      assert.ok(
        out.includes('error validating bundle "throw-during-validate.js"'),
        'should log bundle label in error',
      );
      assert.ok(
        out.includes('mock validation error'),
        'should log thrown error',
      );
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

    it('returns false when source map has source but null line/column (insufficient for stack traces)', async () => {
      // Source map returns source file but no original line/column (allowed by spec for
      // sparse/partial maps). We require precise position for every "new Error" so stack
      // traces resolve correctly — so we fail validation when position is missing.
      const bundle = 'throw new Error("x");';
      const sourceContent = [
        'function init() {',
        '  throw new Error("x");',
        '}',
      ].join('\n');
      const mapJson = makeSourceMap(sourceContent, 1, 6, 2, 2);
      const jsPath = join(tmpDir, 'null-position.js');
      const mapPath = join(tmpDir, 'null-position.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      const errors: string[] = [];
      mock.method(console, 'log', noop);
      mock.method(console, 'warn', noop);
      mock.method(console, 'error', (...args: unknown[]) => {
        errors.push(args.map((a) => String(a)).join(' '));
      });
      const { SourceMapConsumer } = await import('source-map');
      const consumer = await new SourceMapConsumer(mapJson);
      const consumerProto = Object.getPrototypeOf(consumer);
      consumer.destroy();
      mock.method(consumerProto, 'originalPositionFor', () => ({
        source: 'src.ts',
        line: null,
        column: null,
        name: null,
      }));
      const ok = await validateBundle({
        jsPath,
        mapPath,
        label: 'null-position.js',
      });
      assert.strictEqual(ok, false);
      assert.ok(
        errors.some(
          (e) =>
            e.includes('no original line/column') && e.includes('stack traces'),
        ),
        'should log that precise position is required for stack traces',
      );
    });

    it('returns false when source map has negative column (avoids false positive from slice)', async () => {
      // With a negative column, sourceLine.slice(column) uses JS "from end" semantics, so we
      // check the wrong part of the line. Example: line "  throw new Error(\"x\");", column -14
      // gives slice(-14) = "new Error(\"x\");" which contains TARGET_STRING, so without the fix
      // validation would incorrectly pass. We reject negative (and line < 1) as invalid.
      const bundle = 'throw new Error("x");';
      const sourceContent = '  throw new Error("x");';
      const mapJson = makeSourceMap(sourceContent, 1, 6, 1, 2);
      const jsPath = join(tmpDir, 'negative-column.js');
      const mapPath = join(tmpDir, 'negative-column.js.map');
      await writeFile(jsPath, bundle);
      await writeFile(mapPath, mapJson);
      const errors: string[] = [];
      mock.method(console, 'log', noop);
      mock.method(console, 'warn', noop);
      mock.method(console, 'error', (...args: unknown[]) => {
        errors.push(args.map((a) => String(a)).join(' '));
      });
      const { SourceMapConsumer } = await import('source-map');
      const consumer = await new SourceMapConsumer(mapJson);
      const consumerProto = Object.getPrototypeOf(consumer);
      consumer.destroy();
      mock.method(consumerProto, 'originalPositionFor', () => ({
        source: 'src.ts',
        line: 1,
        column: -14, // malformed: slice(-14) on "  throw new Error(\"x\");" = "new Error(\"x\");" -> false pass
        name: null,
      }));
      const ok = await validateBundle({
        jsPath,
        mapPath,
        label: 'negative-column.js',
      });
      assert.strictEqual(ok, false);
      assert.ok(
        errors.some(
          (e) =>
            e.includes('invalid original line/column') &&
            e.includes('column: -14'),
        ),
        'should log invalid line/column including the negative column',
      );
    });
  });

  describe('main', () => {
    let mainTestDir: string | undefined;

    afterEach(async () => {
      if (mainTestDir !== undefined) {
        await rm(mainTestDir, { recursive: true, force: true });
        mainTestDir = undefined;
      }
    });

    it('exits with 1 when dist/chrome does not exist', async () => {
      mock.method(process, 'cwd', () => EMPTY_FIXTURE, { times: Infinity });
      const exitMock = mock.method(process, 'exit', noop as () => never);
      mock.method(console, 'error', noop);
      mock.method(console, 'log', noop);
      await main();
      assert.ok(exitMock.mock.calls.length >= 1);
      assert.strictEqual(exitMock.mock.calls[0].arguments[0], 1);
    });

    it('exits with 1 when dist/chrome exists but has no .js+.map pairs', async () => {
      mainTestDir = await mkdtemp(
        join(tmpdir(), 'sourcemap-validator-empty-chrome-'),
      );
      await mkdir(join(mainTestDir, 'dist', 'chrome'), { recursive: true });
      mock.method(process, 'cwd', () => mainTestDir, { times: Infinity });
      const exitMock = mock.method(process, 'exit', noop as () => never);
      mock.method(console, 'error', noop);
      mock.method(console, 'log', noop);
      await main();
      assert.ok(exitMock.mock.calls.length >= 1);
      assert.strictEqual(exitMock.mock.calls[0].arguments[0], 1);
    });

    it('exits with 1 when at least one bundle fails validation', async () => {
      mainTestDir = await mkdtemp(
        join(tmpdir(), 'sourcemap-validator-main-fail-'),
      );
      const chromeDir = join(mainTestDir, 'dist', 'chrome');
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
      mock.method(process, 'cwd', () => mainTestDir, { times: Infinity });
      const exitMock = mock.method(process, 'exit', noop as () => never);
      mock.method(console, 'log', noop);
      mock.method(console, 'error', noop);
      mock.method(console, 'warn', noop);
      await main();
      assert.ok(exitMock.mock.calls.length >= 1);
      assert.strictEqual(exitMock.mock.calls[0].arguments[0], 1);
    });
  });
});
