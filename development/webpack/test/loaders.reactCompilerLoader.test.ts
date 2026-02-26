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
    threadLoader: 'auto',
    watch: false,
  };

  describe('when threadLoader is not "off"', () => {
    it('returns thread-loader as first loader', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'full',
      });

      assert.strictEqual(loaders.length, 2, 'should return 2 loaders');
      assert.strictEqual(
        (loaders[0] as { loader: string }).loader,
        'thread-loader',
        'first loader should be thread-loader',
      );
    });

    it('returns wrapper loader as second loader', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'full',
      });

      const secondLoader = loaders[1] as { loader: string };
      assert.ok(
        secondLoader.loader.includes('reactCompilerLoaderWrapper'),
        'second loader should be the wrapper',
      );
    });

    it('passes __verbose option to wrapper when verbose is true', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'full',
        verbose: true,
      });

      const wrapperLoader = loaders[1] as {
        loader: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        options: { __verbose?: boolean };
      };
      assert.strictEqual(
        wrapperLoader.options.__verbose,
        true,
        'wrapper should have __verbose: true',
      );
    });

    it('sets poolTimeout to Infinity when watch is true', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'full',
        watch: true,
      });

      const threadLoader = loaders[0] as {
        loader: string;
        options: { poolTimeout: number };
      };
      assert.strictEqual(
        threadLoader.options.poolTimeout,
        Infinity,
        'poolTimeout should be Infinity in watch mode',
      );
    });

    it('sets poolTimeout to 2000 when watch is false', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'full',
        watch: false,
      });

      const threadLoader = loaders[0] as {
        loader: string;
        options: { poolTimeout: number };
      };
      assert.strictEqual(
        threadLoader.options.poolTimeout,
        2000,
        'poolTimeout should be 2000 when not in watch mode',
      );
    });
  });

  describe('when threadLoader is "off" and verbose is false', () => {
    it('returns only one loader (no thread-loader)', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
        verbose: false,
      });

      assert.strictEqual(loaders.length, 1, 'should return 1 loader');
    });

    it('returns direct react-compiler-loader (not wrapper)', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
        verbose: false,
      });

      const loader = loaders[0] as { loader: string };
      assert.ok(
        !loader.loader.includes('Wrapper'),
        'should use direct loader, not wrapper',
      );
      assert.ok(
        loader.loader.includes('react-compiler'),
        'should be react-compiler-loader',
      );
    });

    it('does not include __verbose in options', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
        verbose: false,
      });

      const loader = loaders[0] as {
        loader: unknown;
        options: Record<string, unknown>;
      };
      assert.strictEqual(
        '__verbose' in loader.options,
        false,
        'direct loader should not have __verbose option',
      );
    });
  });

  describe('when threadLoader is "off" but verbose is true', () => {
    it('returns only one loader (no thread-loader)', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
        verbose: true,
      });

      assert.strictEqual(loaders.length, 1, 'should return 1 loader');
    });

    it('uses wrapper loader for verbose logging', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
        verbose: true,
      });

      const loader = loaders[0] as { loader: string };
      assert.ok(
        loader.loader.includes('reactCompilerLoaderWrapper'),
        'should use wrapper for verbose logging',
      );
    });

    it('passes __verbose option to wrapper', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
        verbose: true,
      });

      const loader = loaders[0] as {
        loader: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        options: { __verbose?: boolean };
      };
      assert.strictEqual(
        loader.options.__verbose,
        true,
        'wrapper should have __verbose: true',
      );
    });
  });

  describe('thread-loader presets', () => {
    it('"light" preset configures 1 worker with 10 parallel jobs', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'light',
      });

      const threadLoader = loaders[0] as {
        loader: string;
        options: { workers: number; workerParallelJobs: number };
      };
      assert.strictEqual(threadLoader.options.workers, 1);
      assert.strictEqual(threadLoader.options.workerParallelJobs, 10);
    });

    it('"full" preset configures multiple workers with 15 parallel jobs', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'full',
      });

      const threadLoader = loaders[0] as {
        loader: string;
        options: { workers: number; workerParallelJobs: number };
      };
      assert.ok(
        threadLoader.options.workers >= 1,
        'should have at least 1 worker',
      );
      assert.strictEqual(threadLoader.options.workerParallelJobs, 15);
    });

    it('"auto" preset returns a valid config', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'auto',
      });

      assert.strictEqual(loaders.length, 2, 'should return 2 loaders');
      const threadLoader = loaders[0] as {
        loader: string;
        options: { workers: number; workerParallelJobs: number };
      };
      assert.ok(threadLoader.options.workers >= 1);
      assert.ok(threadLoader.options.workerParallelJobs >= 1);
    });

    it('"off" preset returns no thread-loader', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
      });

      assert.strictEqual(loaders.length, 1, 'should return 1 loader');
      assert.notStrictEqual(
        (loaders[0] as { loader: string }).loader,
        'thread-loader',
      );
    });
  });

  describe('React Compiler options', () => {
    it('sets panicThreshold for debug=all', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
        debug: 'all',
      });

      const loader = loaders[0] as {
        options: { panicThreshold?: string };
      };
      assert.strictEqual(
        loader.options.panicThreshold,
        'all_errors',
        'panicThreshold should be all_errors',
      );
    });

    it('sets panicThreshold for debug=critical', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
        debug: 'critical',
      });

      const loader = loaders[0] as {
        options: { panicThreshold?: string };
      };
      assert.strictEqual(
        loader.options.panicThreshold,
        'critical_errors',
        'panicThreshold should be critical_errors',
      );
    });

    it('does not set panicThreshold for debug=none', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        threadLoader: 'off',
        debug: 'none',
      });

      const loader = loaders[0] as {
        options: { panicThreshold?: string };
      };
      assert.strictEqual(
        loader.options.panicThreshold,
        undefined,
        'panicThreshold should be undefined',
      );
    });
  });
});
