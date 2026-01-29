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

  describe('dot notation (process.env.VAR)', () => {
    it('emits error for undeclared env var', () => {
      const source = 'const x = process.env.UNDECLARED_VAR;';
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED_VAR/u);
    });

    it('handles multiple env vars', () => {
      const source = 'const url = process.env.API_URL + process.env.NODE_ENV;';
      const { context, emittedErrors } = createMockContext(
        new Set(['API_URL', 'NODE_ENV']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });

  describe('bracket notation (process.env["VAR"])', () => {
    it('emits error for undeclared env var', () => {
      const source = 'const x = process.env["UNDECLARED_VAR"];';
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED_VAR/u);
    });

    it('handles single quoted strings', () => {
      const source = "const x = process.env['NODE_ENV'];";
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('ignores dynamic access that cannot be statically analyzed', () => {
      const source = `
        const key = 'SOME_VAR';
        const x = process.env[key];
      `;
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });

  describe('destructuring (const { VAR } = process.env)', () => {
    it('emits error for undeclared env var', () => {
      const source = 'const { UNDECLARED_VAR } = process.env;';
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED_VAR/u);
    });

    it('handles multiple destructured vars', () => {
      const source = 'const { NODE_ENV, API_URL, DEBUG } = process.env;';
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV', 'API_URL', 'DEBUG']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles renamed destructuring', () => {
      const source = 'const { NODE_ENV: env } = process.env;';
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles destructuring with default values', () => {
      const source = "const { NODE_ENV = 'development' } = process.env;";
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles let and var declarations', () => {
      const source = `
        let { VAR_A } = process.env;
        var { VAR_B } = process.env;
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(['VAR_A', 'VAR_B']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });

  describe('mixed patterns', () => {
    it('detects env vars across all patterns', () => {
      const source = `
        const dotNotation = process.env.VAR_A;
        const bracketNotation = process.env["VAR_B"];
        const { VAR_C } = process.env;
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(['VAR_A', 'VAR_B', 'VAR_C']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('reports undeclared vars from all patterns', () => {
      const source = `
        const a = process.env.UNDECLARED_A;
        const b = process.env["UNDECLARED_B"];
        const { UNDECLARED_C } = process.env;
      `;
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED_A/u);
      assert.match(emittedErrors[0].message, /UNDECLARED_B/u);
      assert.match(emittedErrors[0].message, /UNDECLARED_C/u);
    });

    it('only reports undeclared vars when mixed with declared vars', () => {
      const source = `
        const declared = process.env.DECLARED;
        const { ALSO_DECLARED } = process.env;
        const undeclared = process.env.UNDECLARED;
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(['DECLARED', 'ALSO_DECLARED']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      assert.match(emittedErrors[0].message, /UNDECLARED/u);
      assert.doesNotMatch(emittedErrors[0].message, /- DECLARED/u);
      assert.doesNotMatch(emittedErrors[0].message, /- ALSO_DECLARED/u);
    });
  });

  describe('file type handling', () => {
    it('parses TypeScript files correctly', () => {
      const source = `
        const env: string = process.env.NODE_ENV!;
        interface Config { env: string }
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV']),
        '/test/file.ts',
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses TSX files correctly', () => {
      const source = `
        const Component = () => <div>{process.env.NODE_ENV}</div>;
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV']),
        '/test/file.tsx',
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses JavaScript files correctly', () => {
      const source = 'const env = process.env.NODE_ENV;';
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV']),
        '/test/file.js',
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses .js files with JSX syntax correctly', () => {
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
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV', 'APP_NAME']),
        '/test/file.js',
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses .js files with JSX fragment syntax correctly', () => {
      const source = `
        const Component = () => {
          return <></>;
        };
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(),
        '/test/file.js',
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses JSX files correctly', () => {
      const source = `
        const Component = () => <div>{process.env.NODE_ENV}</div>;
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV']),
        '/test/file.jsx',
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('parses MTS files correctly', () => {
      const source = 'export const env = process.env.NODE_ENV;';
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV']),
        '/test/file.mts',
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });

  describe('edge cases', () => {
    it('deduplicates multiple references to the same undeclared var', () => {
      const source = `
        const a = process.env.SAME_VAR;
        const b = process.env.SAME_VAR;
        const { SAME_VAR } = process.env;
      `;
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 1);
      // Count occurrences of SAME_VAR in error message - should only appear once
      const matches = emittedErrors[0].message.match(/SAME_VAR/gu);
      assert.strictEqual(matches?.length, 1);
    });

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

    it('does not detect process.env without property access', () => {
      const source = 'const allEnv = process.env;';
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('does not detect env on non-process objects', () => {
      const source = `
        const myObj = { env: { VAR: 'value' } };
        const x = myObj.env.VAR;
      `;
      const { context, emittedErrors } = createMockContext(new Set());

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles nested expressions with process.env', () => {
      const source = `
        const config = {
          env: process.env.NODE_ENV,
          nested: {
            url: process.env["API_URL"]
          }
        };
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV', 'API_URL']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles env vars in function parameters', () => {
      const source = `
        function getEnv() {
          return process.env.NODE_ENV;
        }
        const fn = () => process.env["API_URL"];
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV', 'API_URL']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });

    it('handles env vars in conditional expressions', () => {
      const source = `
        const isProd = process.env.NODE_ENV === 'production';
        const url = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
      `;
      const { context, emittedErrors } = createMockContext(
        new Set(['NODE_ENV', 'PROD_URL', 'DEV_URL']),
      );

      const result = envValidationLoader.call(context, source);

      assert.strictEqual(result, source);
      assert.strictEqual(emittedErrors.length, 0);
    });
  });
});
