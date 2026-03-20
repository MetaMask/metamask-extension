import { execFileSync } from 'child_process';
import fs from 'fs';
import { AUTOMATION_TYPE } from './constants';
import { getDiffByAutomationType } from './get-diff';

jest.mock('child_process', () => ({
  execFileSync: jest.fn(),
}));

const mockExecFileSync = jest.mocked(execFileSync);

describe('getDiffByAutomationType()', (): void => {
  beforeEach((): void => {
    jest.restoreAllMocks();
    mockExecFileSync.mockReset();
  });

  describe('when the automation type is the pre-commit hook', (): void => {
    it('returns an empty string when a merge is in progress', (): void => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      mockExecFileSync.mockReturnValueOnce('.git/MERGE_HEAD');

      expect(
        getDiffByAutomationType(AUTOMATION_TYPE.PRE_COMMIT_HOOK),
      ).toStrictEqual('');

      expect(mockExecFileSync).toHaveBeenCalledTimes(1);
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        ['rev-parse', '--git-path', 'MERGE_HEAD'],
        expect.objectContaining({
          encoding: 'utf8',
          maxBuffer: 50 * 1024 * 1024,
        }),
      );
    });

    it('gets the pre-commit diff with the configured git options', (): void => {
      const fakeDiff = 'diff --git a/foo.ts b/foo.ts\n+added line';
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      mockExecFileSync.mockReturnValueOnce('.git/MERGE_HEAD');
      mockExecFileSync.mockReturnValueOnce(fakeDiff);

      expect(
        getDiffByAutomationType(AUTOMATION_TYPE.PRE_COMMIT_HOOK),
      ).toStrictEqual(fakeDiff);

      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        1,
        'git',
        ['rev-parse', '--git-path', 'MERGE_HEAD'],
        expect.objectContaining({
          encoding: 'utf8',
          maxBuffer: 50 * 1024 * 1024,
        }),
      );
      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        2,
        'git',
        ['diff', '--cached', 'HEAD'],
        expect.objectContaining({
          encoding: 'utf8',
          maxBuffer: 50 * 1024 * 1024,
        }),
      );
    });
  });

  describe('when the automation type is the pre-push hook', (): void => {
    it('gets the pre-push diff with the configured git options', (): void => {
      const currentBranch = 'fix-fitness-merge';
      const fakeDiff = 'diff --git a/foo.ts b/foo.ts\n+added line';
      mockExecFileSync.mockReturnValueOnce(currentBranch);
      mockExecFileSync.mockReturnValueOnce(fakeDiff);

      expect(
        getDiffByAutomationType(AUTOMATION_TYPE.PRE_PUSH_HOOK),
      ).toStrictEqual(fakeDiff);

      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        1,
        'git',
        ['rev-parse', '--abbrev-ref', 'HEAD'],
        expect.objectContaining({
          encoding: 'utf8',
          maxBuffer: 50 * 1024 * 1024,
        }),
      );
      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        2,
        'git',
        [
          'diff',
          currentBranch,
          `origin/${currentBranch}`,
          '--',
          '.',
          ':(exclude)development/fitness-functions/',
        ],
        expect.objectContaining({
          encoding: 'utf8',
          maxBuffer: 50 * 1024 * 1024,
        }),
      );
    });
  });
});
