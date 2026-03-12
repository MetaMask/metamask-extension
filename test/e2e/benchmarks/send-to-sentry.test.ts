import { execSync } from 'child_process';

// eslint-disable-next-line import/first
import { getGitCommitHash, getGitBranch } from './send-to-sentry-utils';

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

describe('send-to-sentry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
