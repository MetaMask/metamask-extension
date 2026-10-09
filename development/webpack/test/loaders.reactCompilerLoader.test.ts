import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getReactCompilerLoader,
  type ReactCompilerLoaderConfig,
} from '../utils/loaders/reactCompilerLoader';

describe('getReactCompilerLoader', () => {
  const baseConfig: ReactCompilerLoaderConfig = {
    target: '18',
    verbose: false,
    debug: 'none',
    threadLoaderEnabled: false,
  };

  describe('when threadLoaderEnabled is true', () => {
    it('returns wrapper loader', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        threadLoaderEnabled: true,
      });

      assert.ok(
        (loader as { loader: string }).loader.includes(
          'reactCompilerLoaderWrapper',
        ),
      );
    });

    it('passes __verbose option when verbose is true', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        threadLoaderEnabled: true,
        verbose: true,
      });

      const opts = (
        loader as {
          options: { __verbose?: boolean };
        }
      ).options;
      assert.strictEqual(opts.__verbose, true);
    });

    it('passes __verbose: false when verbose is false', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        threadLoaderEnabled: true,
        verbose: false,
      });

      const opts = (
        loader as {
          options: { __verbose?: boolean };
        }
      ).options;
      assert.strictEqual(opts.__verbose, false);
    });
  });

  describe('when threadLoaderEnabled is false and verbose is false', () => {
    it('still uses the wrapper loader (it names source-map files relative to the build context)', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        threadLoaderEnabled: false,
        verbose: false,
      });

      assert.ok(
        (loader as { loader: string }).loader.includes(
          'reactCompilerLoaderWrapper',
        ),
      );
    });

    it('passes __verbose: false', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        threadLoaderEnabled: false,
        verbose: false,
      });

      const opts = (loader as { options: Record<string, unknown> }).options;
      assert.strictEqual(opts.__verbose, false);
    });
  });

  describe('when threadLoaderEnabled is false but verbose is true', () => {
    it('uses wrapper loader for verbose logging', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        threadLoaderEnabled: false,
        verbose: true,
      });

      assert.ok(
        (loader as { loader: string }).loader.includes(
          'reactCompilerLoaderWrapper',
        ),
      );
    });

    it('passes __verbose option', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        threadLoaderEnabled: false,
        verbose: true,
      });

      const opts = (
        loader as {
          options: { __verbose?: boolean };
        }
      ).options;
      assert.strictEqual(opts.__verbose, true);
    });
  });

  describe('React Compiler options', () => {
    it('sets panicThreshold for debug=all', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        debug: 'all',
      });

      const opts = (loader as { options: { panicThreshold?: string } }).options;
      assert.strictEqual(opts.panicThreshold, 'all_errors');
    });

    it('sets panicThreshold for debug=critical', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        debug: 'critical',
      });

      const opts = (loader as { options: { panicThreshold?: string } }).options;
      assert.strictEqual(opts.panicThreshold, 'critical_errors');
    });

    it('does not set panicThreshold for debug=none', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        debug: 'none',
      });

      const opts = (loader as { options: { panicThreshold?: string } }).options;
      assert.strictEqual(opts.panicThreshold, undefined);
    });
  });
});

describe('reactCompilerLoaderWrapper', () => {
  it('names the input file relative to the build context in the source map', async () => {
    const { default: wrapper } =
      await import('../utils/loaders/reactCompilerLoaderWrapper');
    const rootContext = '/project/app';
    const resourcePath = '/project/ui/component.tsx';
    // `withResolvers` is supported by Node.js LTS. It's optional in global type due to older
    // browser support.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { promise, resolve } =
      Promise.withResolvers!<
        [Error | null | undefined, string | undefined, unknown]
      >();
    const context = {
      rootContext,
      resourcePath,
      getOptions: () => ({ target: '18', __verbose: false }),
      async:
        () =>
        (...args: [Error | null | undefined, string | undefined, unknown]) =>
          resolve(args),
    } as unknown as Parameters<typeof wrapper>[0] &
      ThisParameterType<typeof wrapper>;

    wrapper.call(context, 'export const a = 1;', undefined);
    const [err, code, map] = await promise;

    assert.strictEqual(err, null);
    assert.ok(code);
    const mapObj = map as { sources: string[] };
    assert.deepStrictEqual(mapObj.sources, ['webpack://../ui/component.tsx']);
  });
});
