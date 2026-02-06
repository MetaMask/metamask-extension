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
    disableThreadLoader: false,
    watch: false,
  };

  describe('when disableThreadLoader is false', () => {
    it('returns thread-loader as first loader', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        disableThreadLoader: false,
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
        disableThreadLoader: false,
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
        disableThreadLoader: false,
        verbose: true,
      });

      const wrapperLoader = loaders[1] as {
        loader: string;
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
        disableThreadLoader: false,
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

    it('sets poolTimeout to 500 when watch is false', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        disableThreadLoader: false,
        watch: false,
      });

      const threadLoader = loaders[0] as {
        loader: string;
        options: { poolTimeout: number };
      };
      assert.strictEqual(
        threadLoader.options.poolTimeout,
        500,
        'poolTimeout should be 500 when not in watch mode',
      );
    });
  });

  describe('when disableThreadLoader is true', () => {
    it('returns only one loader (no thread-loader)', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        disableThreadLoader: true,
      });

      assert.strictEqual(loaders.length, 1, 'should return 1 loader');
    });

    it('returns direct react-compiler-loader (not wrapper)', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        disableThreadLoader: true,
      });

      const loader = loaders[0] as { loader: string };
      // Direct loader path should NOT include 'wrapper'
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
        disableThreadLoader: true,
        verbose: true, // Even when verbose is true
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

  describe('thread-loader worker configuration', () => {
    it('configures workers based on available parallelism', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        disableThreadLoader: false,
      });

      const threadLoader = loaders[0] as {
        loader: string;
        options: { workers: number };
      };
      assert.ok(
        threadLoader.options.workers >= 1,
        'should have at least 1 worker',
      );
    });

    it('sets workerParallelJobs to 50', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        disableThreadLoader: false,
      });

      const threadLoader = loaders[0] as {
        loader: string;
        options: { workerParallelJobs: number };
      };
      assert.strictEqual(
        threadLoader.options.workerParallelJobs,
        50,
        'workerParallelJobs should be 50',
      );
    });
  });

  describe('React Compiler options', () => {
    it('sets panicThreshold for debug=all', () => {
      const loaders = getReactCompilerLoader({
        ...baseConfig,
        disableThreadLoader: true,
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
        disableThreadLoader: true,
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
        disableThreadLoader: true,
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
