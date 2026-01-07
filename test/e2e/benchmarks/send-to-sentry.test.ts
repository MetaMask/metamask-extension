import { execSync } from 'child_process';

// Mock child_process before importing implementation
jest.mock('child_process', () => ({
  execSync: jest.fn((cmd: string) => {
    if (cmd === 'git rev-parse HEAD') {
      return 'abc123def456\n';
    }
    if (cmd === 'git branch --show-current') {
      return 'test-branch\n';
    }
    throw new Error('Unknown command');
  }),
}));

// eslint-disable-next-line import/first
import {
  isStandardBenchmarkResult,
  isUserActionResult,
  flatten,
  getGitCommitHash,
  getGitBranch,
} from './send-to-sentry';

describe('send-to-sentry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isStandardBenchmarkResult', () => {
    it('returns true for valid benchmark with mean object', () => {
      expect(
        isStandardBenchmarkResult({
          mean: { uiStartup: 500 },
          min: {},
          max: {},
        }),
      ).toBe(true);
    });

    it('returns false for null/undefined/primitives', () => {
      expect(isStandardBenchmarkResult(null)).toBe(false);
      expect(isStandardBenchmarkResult(undefined)).toBe(false);
      expect(isStandardBenchmarkResult('string')).toBe(false);
    });

    it('returns false without mean property', () => {
      expect(isStandardBenchmarkResult({ min: {}, max: {} })).toBe(false);
    });
  });

  describe('isUserActionResult', () => {
    it('returns true for object with testTitle and numeric metric', () => {
      expect(isUserActionResult({ testTitle: 'test', duration: 1234 })).toBe(
        true,
      );
    });

    it('returns false without testTitle', () => {
      expect(isUserActionResult({ duration: 1234 })).toBe(false);
    });

    it('returns false without numeric metrics', () => {
      expect(isUserActionResult({ testTitle: 'test', foo: 'bar' })).toBe(false);
    });
  });

  describe('flatten', () => {
    it('flattens object with prefix', () => {
      expect(flatten({ a: 1, b: 2 }, 'prefix')).toEqual({
        'prefix.a': 1,
        'prefix.b': 2,
      });
    });

    it('handles undefined/empty', () => {
      expect(flatten(undefined, 'prefix')).toEqual({});
      expect(flatten({}, 'prefix')).toEqual({});
    });
  });

  describe('git helpers', () => {
    it('getGitCommitHash returns trimmed hash', () => {
      expect(getGitCommitHash()).toBe('abc123def456');
    });

    it('getGitBranch returns trimmed branch', () => {
      expect(getGitBranch()).toBe('test-branch');
    });

    it('returns fallback on error', () => {
      (execSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('git not available');
      });
      expect(getGitCommitHash()).toBe('unknown');

      (execSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('git not available');
      });
      expect(getGitBranch()).toBe('local');
    });
  });
});
