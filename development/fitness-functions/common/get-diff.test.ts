import fs from 'fs';
import os from 'os';
import * as path from 'path';
import { getPrDiff } from '../../../.github/scripts/shared/get-pr-diff.mts';
import { AUTOMATION_TYPE } from './constants';
import { getDiffByAutomationType } from './get-diff';

jest.mock('../../../.github/scripts/shared/get-pr-diff.mts', () => ({
  getPrDiff: jest.fn(),
}));

describe('getDiffByAutomationType', () => {
  const originalBaseSha = process.env.BASE_SHA;
  const originalBaseRef = process.env.BASE_REF;

  afterEach(() => {
    restoreEnvironmentVariable('BASE_SHA', originalBaseSha);
    restoreEnvironmentVariable('BASE_REF', originalBaseRef);
  });

  describe('in CI', () => {
    it('fetches the PR diff against BASE_SHA and returns BASE_SHA as the base ref', async () => {
      process.env.BASE_SHA = 'base-sha';
      process.env.BASE_REF = 'release/1.0.0';
      jest.mocked(getPrDiff).mockReturnValue('the diff');

      const result = await getDiffByAutomationType(AUTOMATION_TYPE.CI);

      expect(getPrDiff).toHaveBeenCalledWith({
        baseSha: 'base-sha',
        baseBranch: 'release/1.0.0',
      });
      expect(result).toStrictEqual({ baseRef: 'base-sha', diff: 'the diff' });
    });

    it('reads the diff from the given file and returns BASE_SHA as the base ref', async () => {
      process.env.BASE_SHA = 'base-sha';
      const temporaryDirectoryPath = fs.mkdtempSync(
        path.join(os.tmpdir(), 'fitness-functions-'),
      );
      const diffPath = path.join(temporaryDirectoryPath, 'changes.diff');
      fs.writeFileSync(diffPath, 'the diff from a file');

      try {
        const result = await getDiffByAutomationType(
          AUTOMATION_TYPE.CI,
          diffPath,
        );

        expect(result).toStrictEqual({
          baseRef: 'base-sha',
          diff: 'the diff from a file',
        });
      } finally {
        fs.rmSync(temporaryDirectoryPath, { recursive: true, force: true });
      }
    });

    it('throws when BASE_SHA is not set', async () => {
      delete process.env.BASE_SHA;

      await expect(
        getDiffByAutomationType(AUTOMATION_TYPE.CI, '/dev/null'),
      ).rejects.toThrow('BASE_SHA must be set when running in CI');
    });
  });
});

function restoreEnvironmentVariable(
  name: string,
  value: string | undefined,
): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
