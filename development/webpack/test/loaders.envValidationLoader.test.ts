import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LoaderContext } from 'webpack';
import envValidationLoader, {
  EnvValidationLoaderOptions,
} from '../utils/loaders/envValidationLoader';

describe('envValidationLoader', () => {
  function createMockContext(
    declarations: Set<string>,
    resourcePath = '/test/file.ts',
  ) {
    const emittedErrors: Error[] = [];
    const mockContext = {
      getOptions: () => ({ declarations }),
      resourcePath,
      emitError: (err: Error) => emittedErrors.push(err),
    } as unknown as LoaderContext<EnvValidationLoaderOptions>;
    return { context: mockContext, emittedErrors };
  }

  describe('success cases', () => {
    it('passes source unchanged when env vars are declared', () => {
      const source = 'const env = process.env.NODE_ENV;';
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('passes source unchanged when no env vars are present', () => {
      const source = 'const x = 1;';
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('passes source unchanged when multiple env vars are declared', () => {
      const source =
        'const url = process.env.API_URL + process.env.NODE_ENV;';
      const { context, emittedErrors } = createMockContext(
        new Set(['API_URL', 'NODE_ENV']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });

  describe('error cases', () => {
    it('emits error for single undeclared env var', () => {
      const source = 'const x = process.env.UNDECLARED_VAR;';
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED_VAR/u);
    });

    it('emits error listing multiple undeclared env vars', () => {
      const source = 'const x = process.env.VAR_A + process.env.VAR_B;';
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /VAR_A/u);
      assert.match(emittedErrors[0].message, /VAR_B/u);
    });

    it('deduplicates multiple references to the same undeclared var', () => {
      const source =
        'const x = process.env.SAME_VAR + process.env.SAME_VAR;';
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      // Count occurrences of SAME_VAR in error message - should only appear once
      const matches = emittedErrors[0].message.match(/SAME_VAR/gu);
      assert.strictEqual(matches?.length, 1);
    });

    it('only reports undeclared vars when mixed with declared vars', () => {
      const source =
        'const x = process.env.DECLARED + process.env.UNDECLARED;';
      const { context, emittedErrors } = createMockContext(
        new Set(['DECLARED']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED/u);
      assert.doesNotMatch(emittedErrors[0].message, /- DECLARED/u);
    });
  });

  describe('edge cases', () => {
    it('includes resource path in error message', () => {
      const source = 'const x = process.env.MISSING_VAR;';
      const resourcePath = '/path/to/my/file.ts';
      const { context, emittedErrors } = createMockContext(
        new Set(),
        resourcePath,
      );

      envValidationLoader.call(context, source);

      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, new RegExp(resourcePath, 'u'));
    });

    it('includes fix instructions in error message', () => {
      const source = 'const x = process.env.MISSING_VAR;';
      const { context, emittedErrors } = createMockContext(new Set());

      envValidationLoader.call(context, source);

      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /builds\.yml/u);
    });
  });
});
