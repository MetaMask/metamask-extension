import { execFileSync } from 'child_process';
import { getPrDiff } from './get-pr-diff.mts';

jest.mock('child_process', () => ({
  execFileSync: jest.fn(),
}));

// `@actions/github` is ESM-only and cannot be resolved by Jest, so it is
// mocked virtually. An empty payload means there is no PR number, which makes
// `getPrDiff` skip the GitHub API and diff with Git.
jest.mock(
  '@actions/github',
  () => ({
    context: { payload: {} },
  }),
  { virtual: true },
);

describe('getPrDiff', () => {
  const originalBaseSha = process.env.BASE_SHA;

  afterEach(() => {
    if (originalBaseSha === undefined) {
      delete process.env.BASE_SHA;
    } else {
      process.env.BASE_SHA = originalBaseSha;
    }
  });

  it('diffs against the given base SHA when the GitHub API diff is unavailable', () => {
    process.env.BASE_SHA = 'sha-from-environment';
    jest.mocked(execFileSync).mockReturnValue('the diff');

    const diff = getPrDiff({ baseSha: 'given-sha' });

    expect(diff).toBe('the diff');
    expect(execFileSync).toHaveBeenCalledWith(
      'git',
      ['diff', 'given-sha...HEAD'],
      expect.anything(),
    );
  });

  it('diffs against BASE_SHA when no base SHA is given', () => {
    process.env.BASE_SHA = 'sha-from-environment';
    jest.mocked(execFileSync).mockReturnValue('the diff');

    getPrDiff();

    expect(execFileSync).toHaveBeenCalledWith(
      'git',
      ['diff', 'sha-from-environment...HEAD'],
      expect.anything(),
    );
  });
});
