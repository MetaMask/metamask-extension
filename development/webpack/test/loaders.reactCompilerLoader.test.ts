import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getReactCompilerLoader,
  type ReactCompilerLoaderConfig,
} from '../utils/loaders/reactCompilerLoader';

describe('getReactCompilerLoader', () => {
  const baseConfig: ReactCompilerLoaderConfig = {
    target: '17',
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
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
          // eslint-disable-next-line @typescript-eslint/naming-convention
          options: { __verbose?: boolean };
        }
      ).options;
      assert.strictEqual(opts.__verbose, false);
    });
  });

  describe('when threadLoaderEnabled is false and verbose is false', () => {
    it('returns direct react-compiler-loader (not wrapper)', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        threadLoaderEnabled: false,
        verbose: false,
      });

      const path = (loader as { loader: string }).loader;
      assert.ok(!path.includes('Wrapper'));
      assert.ok(path.includes('react-compiler'));
    });

    it('does not include __verbose in options', () => {
      const loader = getReactCompilerLoader({
        ...baseConfig,
        threadLoaderEnabled: false,
        verbose: false,
      });

      const opts = (loader as { options: Record<string, unknown> }).options;
      assert.strictEqual('__verbose' in opts, false);
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
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
