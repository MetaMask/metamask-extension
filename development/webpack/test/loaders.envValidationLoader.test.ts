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
    let callbackResult: { error: Error | null; source: string | undefined } = {
      error: null,
      source: undefined,
    };
    let resolveCallback: () => void;
    const callbackPromise = new Promise<void>((resolve) => {
      resolveCallback = resolve;
    });

    const mockContext = {
      getOptions: () => ({ declarations }),
      resourcePath,
      emitError: (err: Error) => emittedErrors.push(err),
      async: () => (error: Error | null, source?: string) => {
        callbackResult = { error, source };
        resolveCallback();
      },
    } as unknown as LoaderContext<EnvValidationLoaderOptions>;
    return {
      context: mockContext,
      emittedErrors,
      callbackPromise,
      callbackResult: () => callbackResult,
    };
  }

  describe('dot notation (process.env.VAR)', () => {
    it('emits error for undeclared env var', async () => {
      const source = 'const x = process.env.UNDECLARED_VAR;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set());

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED_VAR/u);
    });

    it('handles multiple env vars', async () => {
      const source = 'const url = process.env.API_URL + process.env.NODE_ENV;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['API_URL', 'NODE_ENV']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });

  describe('bracket notation (process.env["VAR"])', () => {
    it('emits error for undeclared env var', async () => {
      const source = 'const x = process.env["UNDECLARED_VAR"];';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set());

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED_VAR/u);
    });

    it('handles single quoted strings', async () => {
      const source = "const x = process.env['NODE_ENV'];";
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('ignores dynamic access that cannot be statically analyzed', async () => {
      const source = `
        const key = 'SOME_VAR';
        const x = process.env[key];
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set());

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });

  describe('destructuring (const { VAR } = process.env)', () => {
    it('emits error for undeclared env var', async () => {
      const source = 'const { UNDECLARED_VAR } = process.env;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set());

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED_VAR/u);
    });

    it('handles multiple destructured vars', async () => {
      const source = 'const { NODE_ENV, API_URL, DEBUG } = process.env;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV', 'API_URL', 'DEBUG']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles renamed destructuring', async () => {
      const source = 'const { NODE_ENV: env } = process.env;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles destructuring with default values', async () => {
      const source = "const { NODE_ENV = 'development' } = process.env;";
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles let and var declarations', async () => {
      const source = `
        let { VAR_A } = process.env;
        var { VAR_B } = process.env;
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['VAR_A', 'VAR_B']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('ignores rest element (spread operator) in destructuring', async () => {
      const source = 'const { NODE_ENV, ...rest } = process.env;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('validates named vars while ignoring rest element', async () => {
      const source = 'const { DECLARED, UNDECLARED, ...rest } = process.env;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['DECLARED']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED/u);
      assert.doesNotMatch(emittedErrors[0].message, /rest/u);
    });
  });

  describe('mixed patterns', () => {
    it('detects env vars across all patterns', async () => {
      const source = `
        const dotNotation = process.env.VAR_A;
        const bracketNotation = process.env["VAR_B"];
        const { VAR_C } = process.env;
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['VAR_A', 'VAR_B', 'VAR_C']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('reports undeclared vars from all patterns', async () => {
      const source = `
        const a = process.env.UNDECLARED_A;
        const b = process.env["UNDECLARED_B"];
        const { UNDECLARED_C } = process.env;
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set());

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED_A/u);
      assert.match(emittedErrors[0].message, /UNDECLARED_B/u);
      assert.match(emittedErrors[0].message, /UNDECLARED_C/u);
    });

    it('only reports undeclared vars when mixed with declared vars', async () => {
      const source = `
        const declared = process.env.DECLARED;
        const { ALSO_DECLARED } = process.env;
        const undeclared = process.env.UNDECLARED;
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['DECLARED', 'ALSO_DECLARED']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED/u);
      assert.doesNotMatch(emittedErrors[0].message, /- DECLARED/u);
      assert.doesNotMatch(emittedErrors[0].message, /- ALSO_DECLARED/u);
    });
  });

  describe('file type handling', () => {
    it('parses TypeScript files correctly', async () => {
      const source = `
        const env: string = process.env.NODE_ENV!;
        interface Config { env: string }
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV']), '/test/file.ts');

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses TSX files correctly', async () => {
      const source = `
        const Component = () => <div>{process.env.NODE_ENV}</div>;
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV']), '/test/file.tsx');

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses JavaScript files correctly', async () => {
      const source = 'const env = process.env.NODE_ENV;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV']), '/test/file.js');

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses .js files with JSX syntax correctly', async () => {
      // This is common in React projects that don't use .jsx extension
      const source = `
        const Component = () => {
          return (
            <BannerAlert severity={process.env.NODE_ENV}>
              <Text>{process.env.APP_NAME}</Text>
            </BannerAlert>
          );
        };
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV', 'APP_NAME']), '/test/file.js');

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses .js files with JSX fragment syntax correctly', async () => {
      const source = `
        const Component = () => {
          return <></>;
        };
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(), '/test/file.js');

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses JSX files correctly', async () => {
      const source = `
        const Component = () => <div>{process.env.NODE_ENV}</div>;
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV']), '/test/file.jsx');

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses MTS files correctly', async () => {
      const source = 'export const env = process.env.NODE_ENV;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV']), '/test/file.mts');

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });

  describe('edge cases', () => {
    it('deduplicates multiple references to the same undeclared var', async () => {
      const source = `
        const a = process.env.SAME_VAR;
        const b = process.env.SAME_VAR;
        const { SAME_VAR } = process.env;
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set());

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 1);
      // Count occurrences of SAME_VAR in error message - should only appear once
      const matches = emittedErrors[0].message.match(/SAME_VAR/gu);
      assert.strictEqual(matches?.length, 1);
    });

    it('includes resource path in error message', async () => {
      const source = 'const x = process.env.MISSING_VAR;';
      const resourcePath = '/path/to/my/file.ts';
      const { context, emittedErrors, callbackPromise } = createMockContext(
        new Set(),
        resourcePath,
      );

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, new RegExp(resourcePath, 'u'));
    });

    it('includes fix instructions in error message', async () => {
      const source = 'const x = process.env.MISSING_VAR;';
      const { context, emittedErrors, callbackPromise } = createMockContext(
        new Set(),
      );

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /builds\.yml/u);
    });

    it('does not detect process.env without property access', async () => {
      const source = 'const allEnv = process.env;';
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set());

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('does not detect env on non-process objects', async () => {
      const source = `
        const myObj = { env: { VAR: 'value' } };
        const x = myObj.env.VAR;
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set());

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles nested expressions with process.env', async () => {
      const source = `
        const config = {
          env: process.env.NODE_ENV,
          nested: {
            url: process.env["API_URL"]
          }
        };
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV', 'API_URL']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles env vars in function parameters', async () => {
      const source = `
        function getEnv() {
          return process.env.NODE_ENV;
        }
        const fn = () => process.env["API_URL"];
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV', 'API_URL']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles env vars in conditional expressions', async () => {
      const source = `
        const isProd = process.env.NODE_ENV === 'production';
        const url = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
      `;
      const { context, emittedErrors, callbackPromise, callbackResult } =
        createMockContext(new Set(['NODE_ENV', 'PROD_URL', 'DEV_URL']));

      envValidationLoader.call(context, source);
      await callbackPromise;

      assert.strictEqual(callbackResult().source, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });
});
