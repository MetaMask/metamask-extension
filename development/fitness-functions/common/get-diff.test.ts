import { execSync } from 'child_process';
import { AUTOMATION_TYPE } from './constants';
import { getDiffByAutomationType } from './get-diff';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

const mockExecSync = jest.mocked(execSync);

const GIT_EXEC_SYNC_OPTIONS = {
  maxBuffer: 50 * 1024 * 1024,
};

describe('getDiffByAutomationType()', (): void => {
  beforeEach((): void => {
    mockExecSync.mockReset();
  });

  it('gets the pre-commit diff with increased git buffer size', (): void => {
    const fakeDiff = 'diff --git a/foo.ts b/foo.ts\n+added line';
    mockExecSync.mockReturnValueOnce(Buffer.from(fakeDiff));

    expect(
      getDiffByAutomationType(AUTOMATION_TYPE.PRE_COMMIT_HOOK),
    ).toStrictEqual(fakeDiff);

    expect(mockExecSync).toHaveBeenCalledTimes(1);
    expect(mockExecSync).toHaveBeenCalledWith(
      'git diff --cached HEAD',
      GIT_EXEC_SYNC_OPTIONS,
    );
  });

  it('gets the pre-push diff with increased git buffer size', (): void => {
    const currentBranch = 'fix-fitness-merge';
    const fakeDiff = 'diff --git a/foo.ts b/foo.ts\n+added line';
    mockExecSync.mockReturnValueOnce(Buffer.from(currentBranch));
    mockExecSync.mockReturnValueOnce(Buffer.from(fakeDiff));

    expect(
      getDiffByAutomationType(AUTOMATION_TYPE.PRE_PUSH_HOOK),
    ).toStrictEqual(fakeDiff);

    expect(mockExecSync).toHaveBeenNthCalledWith(
      1,
      'git rev-parse --abbrev-ref HEAD',
      GIT_EXEC_SYNC_OPTIONS,
    );
    expect(mockExecSync).toHaveBeenNthCalledWith(
      2,
      `git diff ${currentBranch} origin/${currentBranch} -- . ':(exclude)development/fitness-functions/'`,
      GIT_EXEC_SYNC_OPTIONS,
    );
  });
});
