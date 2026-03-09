import { execSync } from 'child_process';
import { isMergeInProgress, getPreCommitHookDiff } from './get-diff';

describe('isMergeInProgress()', (): void => {
  const mockExecSync = jest.mocked(execSync);

  jest.mock('child_process');

  beforeEach((): void => {
    mockExecSync.mockClear();
  });

  it('returns true when MERGE_HEAD exists', (): void => {
    mockExecSync.mockReturnValueOnce(Buffer.from('abc123'));

    expect(isMergeInProgress()).toBe(true);
    expect(mockExecSync).toHaveBeenCalledWith(
      'git rev-parse -q --verify MERGE_HEAD',
      expect.any(Object),
    );
  });

  it('returns false when MERGE_HEAD does not exist', (): void => {
    mockExecSync.mockImplementationOnce(() => {
      throw new Error('not a merge');
    });

    expect(isMergeInProgress()).toBe(false);
  });
});

describe('getPreCommitHookDiff()', (): void => {
  it('returns an empty string when a merge is in progress', (): void => {
    // MERGE_HEAD exists → isMergeInProgress returns true
    mockExecSync.mockReturnValueOnce(Buffer.from('abc123'));

    expect(getPreCommitHookDiff()).toBe('');
  });

  it('returns the cached diff when no merge is in progress', (): void => {
    const fakeDiff = 'diff --git a/foo.ts b/foo.ts\n+added line';

    // First call: MERGE_HEAD not found → isMergeInProgress returns false
    mockExecSync.mockImplementationOnce(() => {
      throw new Error('not a merge');
    });
    // Second call: git diff --cached HEAD
    mockExecSync.mockReturnValueOnce(Buffer.from(fakeDiff));

    expect(getPreCommitHookDiff()).toBe(fakeDiff);
    expect(mockExecSync).toHaveBeenCalledWith(
      'git diff --cached HEAD',
      expect.any(Object),
    );
  });
});
