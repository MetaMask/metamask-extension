import { execFileSync } from 'child_process';

import {
  buildWhatsInRcFailureSection,
  buildWhatsInRcSection,
  extractWhatsInRc,
  getChangelogAnchorId,
  getCherryPicksAnchorId,
  getWhatsInRcAnchorId,
} from './cherry-picks-section';

jest.mock('child_process', () => ({
  execFileSync: jest.fn(),
}));

type ExecFileSyncMock = jest.Mock<
  string,
  [string, string[], { encoding: BufferEncoding }]
>;

const execFileSyncMock = execFileSync as unknown as ExecFileSyncMock;

function throwError(error: Error): never {
  throw error;
}

function mockGit(
  commands: Record<string, string | Error>,
  onCall: (args: string[]) => void = () => undefined,
): void {
  execFileSyncMock.mockImplementation((_command, args) => {
    onCall(args);

    const command = args.join(' ');
    const result =
      commands[command] ?? new Error(`Unexpected git command: ${command}`);

    return result instanceof Error ? throwError(result) : result;
  });
}

describe('cherry-picks-section', () => {
  beforeEach(() => {
    execFileSyncMock.mockReset();
  });

  describe('extractWhatsInRc', () => {
    it('extracts cherry-picks and changelog commits using the previous release tag', () => {
      const gitCalls: string[][] = [];
      mockGit(
        {
          'merge-base HEAD origin/main': 'merge-base-sha\n',
          'tag --sort=-version:refname --list v*.*.* --merged merge-base-sha':
            'v13.35.1\nv13.35.0\n',
          'log --ancestry-path --format=%h %s merge-base-sha..HEAD':
            'abc1234 fix: cherry-pick (#123)\n',
          'log --format=%h %s v13.35.1..merge-base-sha --first-parent':
            'def5678 feat: changelog entry (#456)\n',
        },
        (args) => gitCalls.push(args),
      );

      expect(extractWhatsInRc()).toStrictEqual({
        cherryPicks: [{ hash: 'abc1234', subject: 'fix: cherry-pick (#123)' }],
        changelog: [
          { hash: 'def5678', subject: 'feat: changelog entry (#456)' },
        ],
        mergeBase: 'merge-base-sha',
        previousTag: 'v13.35.1',
        changelogFromReleaseBranch: false,
      });
      expect(gitCalls[1]).toStrictEqual([
        'tag',
        '--sort=-version:refname',
        '--list',
        'v*.*.*',
        '--merged',
        'merge-base-sha',
      ]);
    });

    it('falls back to the release branch when main-line changelog is empty', () => {
      mockGit({
        'merge-base HEAD origin/main': 'merge-base-sha\n',
        'tag --sort=-version:refname --list v*.*.* --merged merge-base-sha':
          'v13.39.2\n',
        'log --ancestry-path --format=%h %s merge-base-sha..HEAD':
          'abc1234 release(runway): cherry-pick fix (#123)\n',
        'log --format=%h %s v13.39.2..merge-base-sha --first-parent': '',
        'log --format=%h %s v13.39.2..HEAD':
          'abc1234 release(runway): cherry-pick fix (#123)\ndef5678 feat: feature on release (#456)\n',
      });

      expect(extractWhatsInRc()).toStrictEqual({
        cherryPicks: [
          {
            hash: 'abc1234',
            subject: 'release(runway): cherry-pick fix (#123)',
          },
        ],
        changelog: [
          {
            hash: 'abc1234',
            subject: 'release(runway): cherry-pick fix (#123)',
          },
          { hash: 'def5678', subject: 'feat: feature on release (#456)' },
        ],
        mergeBase: 'merge-base-sha',
        previousTag: 'v13.39.2',
        changelogFromReleaseBranch: true,
      });
    });

    it('falls back to the release branch when main-line changelog is only release commits', () => {
      mockGit({
        'merge-base HEAD origin/main': 'merge-base-sha\n',
        'tag --sort=-version:refname --list v*.*.* --merged merge-base-sha':
          'v13.39.2\n',
        'log --ancestry-path --format=%h %s merge-base-sha..HEAD':
          'abc1234 release(runway): cherry-pick fix (#123)\n',
        'log --format=%h %s v13.39.2..merge-base-sha --first-parent':
          'aaa1111 release: bump version\n',
        'log --format=%h %s v13.39.2..HEAD':
          'abc1234 release(runway): cherry-pick fix (#123)\ndef5678 feat: feature on release (#456)\n',
      });

      expect(extractWhatsInRc()).toMatchObject({
        changelogFromReleaseBranch: true,
        changelog: [
          {
            hash: 'abc1234',
            subject: 'release(runway): cherry-pick fix (#123)',
          },
          { hash: 'def5678', subject: 'feat: feature on release (#456)' },
        ],
      });
    });

    it('falls back when main-line changelog is only scoped release commits', () => {
      mockGit({
        'merge-base HEAD origin/main': 'merge-base-sha\n',
        'tag --sort=-version:refname --list v*.*.* --merged merge-base-sha':
          'v13.39.2\n',
        'log --ancestry-path --format=%h %s merge-base-sha..HEAD':
          'abc1234 release(runway): cherry-pick fix (#123)\n',
        'log --format=%h %s v13.39.2..merge-base-sha --first-parent':
          'aaa1111 release(runway): cut release\nbbb2222 release(cp): bump dep\n',
        'log --format=%h %s v13.39.2..HEAD':
          'abc1234 release(runway): cherry-pick fix (#123)\ndef5678 feat: feature on release (#456)\n',
      });

      expect(extractWhatsInRc()).toMatchObject({
        changelogFromReleaseBranch: true,
        previousTag: 'v13.39.2',
        changelog: [
          {
            hash: 'abc1234',
            subject: 'release(runway): cherry-pick fix (#123)',
          },
          { hash: 'def5678', subject: 'feat: feature on release (#456)' },
        ],
      });
    });

    it('skips merge commits when collecting changelog entries', () => {
      mockGit({
        'merge-base HEAD origin/main': 'merge-base-sha\n',
        'tag --sort=-version:refname --list v*.*.* --merged merge-base-sha':
          'v13.39.2\n',
        'log --ancestry-path --format=%h %s merge-base-sha..HEAD': '',
        'log --format=%h %s v13.39.2..merge-base-sha --first-parent':
          'aaa1111 Merge pull request #1 from MetaMask/release/13.39.2\nbbb2222 feat: real change (#2)\n',
      });

      expect(extractWhatsInRc().changelog).toStrictEqual([
        { hash: 'bbb2222', subject: 'feat: real change (#2)' },
      ]);
    });

    it('returns a null previous tag when none are merged into the merge base', () => {
      mockGit({
        'merge-base HEAD origin/main': 'merge-base-sha\n',
        'tag --sort=-version:refname --list v*.*.* --merged merge-base-sha': '',
        'log --ancestry-path --format=%h %s merge-base-sha..HEAD':
          'abc1234 fix: cherry-pick (#123)\n',
      });

      expect(extractWhatsInRc()).toStrictEqual({
        cherryPicks: [{ hash: 'abc1234', subject: 'fix: cherry-pick (#123)' }],
        changelog: [],
        mergeBase: 'merge-base-sha',
        previousTag: null,
        changelogFromReleaseBranch: false,
      });
    });

    it('throws when a git log command fails', () => {
      mockGit({
        'merge-base HEAD origin/main': 'merge-base-sha\n',
        'tag --sort=-version:refname --list v*.*.* --merged merge-base-sha':
          'v13.35.1\n',
        'log --ancestry-path --format=%h %s merge-base-sha..HEAD': new Error(
          'git log failed',
        ),
      });

      expect(() => extractWhatsInRc()).toThrow('git log failed');
    });
  });

  describe('buildWhatsInRcSection', () => {
    it('builds stable run-specific anchor ids', () => {
      expect(getWhatsInRcAnchorId()).toBe('whats-in-this-rc');
      expect(getWhatsInRcAnchorId('28063612297')).toBe(
        'whats-in-this-rc-28063612297',
      );
      expect(getWhatsInRcAnchorId('Run 123 / RC')).toBe(
        'whats-in-this-rc-run-123-rc',
      );
      expect(getCherryPicksAnchorId('28063612297')).toBe(
        'cherry-picks-28063612297',
      );
      expect(getChangelogAnchorId('28063612297')).toBe('changelog-28063612297');
    });

    it('renders the stable section anchor when no commits are found', () => {
      const section = buildWhatsInRcSection({
        cherryPicks: [],
        changelog: [],
        mergeBase: 'merge-base-sha',
        previousTag: 'v13.35.1',
        changelogFromReleaseBranch: false,
      });

      expect(section).toContain('<a id="whats-in-this-rc"></a>');
      expect(section).toContain('<a id="cherry-picks"></a>');
      expect(section).toContain('No cherry-picks or changelog commits found.');
    });

    it('still emits the cherry-picks anchor when only changelog commits exist', () => {
      const section = buildWhatsInRcSection(
        {
          cherryPicks: [],
          changelog: [
            { hash: 'def5678', subject: 'feat: changelog entry (#456)' },
          ],
          mergeBase: 'merge-base-sha',
          previousTag: 'v13.35.1',
          changelogFromReleaseBranch: false,
        },
        '28063612297',
      );

      expect(section).toContain('<a id="cherry-picks-28063612297"></a>');
      expect(section).toContain('<a id="changelog-28063612297"></a>');
      expect(section).not.toContain('Cherry-picks (');
    });

    it('renders run-specific section anchors when a suffix is provided', () => {
      const section = buildWhatsInRcSection(
        {
          cherryPicks: [
            { hash: 'abc1234', subject: 'fix: cherry-pick (#123)' },
          ],
          changelog: [
            { hash: 'def5678', subject: 'feat: changelog entry (#456)' },
          ],
          mergeBase: 'merge-base-sha',
          previousTag: 'v13.35.1',
          changelogFromReleaseBranch: false,
        },
        '28063612297',
      );

      expect(section).toContain('<a id="whats-in-this-rc-28063612297"></a>');
      expect(section).toContain('<a id="cherry-picks-28063612297"></a>');
      expect(section).toContain('<a id="changelog-28063612297"></a>');
      expect(section).toContain('Changelog (1 commits from main at RC cut)');
    });

    it('labels changelog as release-branch fallback when applicable', () => {
      const section = buildWhatsInRcSection({
        cherryPicks: [],
        changelog: [
          { hash: 'def5678', subject: 'feat: changelog entry (#456)' },
        ],
        mergeBase: 'merge-base-sha',
        previousTag: 'v13.39.2',
        changelogFromReleaseBranch: true,
      });

      expect(section).toContain('Changelog (1 commits since v13.39.2)');
    });

    it('escapes table-breaking characters and links PR references', () => {
      const section = buildWhatsInRcSection({
        cherryPicks: [
          {
            hash: 'abc1234',
            subject: 'fix: keep | slash \\ and <tag> (#123)\nnext line',
          },
        ],
        changelog: [],
        mergeBase: 'merge-base-sha',
        previousTag: 'v13.35.1',
        changelogFromReleaseBranch: false,
      });

      expect(section).toContain('<a id="cherry-picks"></a>');
      expect(section).toContain(
        'fix: keep \\| slash \\\\ and &lt;tag&gt; ([#123](https://github.com/MetaMask/metamask-extension/pull/123)) next line',
      );
    });
  });

  describe('buildWhatsInRcFailureSection', () => {
    it('renders the stable section anchor and escapes the error message', () => {
      const section = buildWhatsInRcFailureSection(
        'git failed for <tag> & branch',
      );

      expect(section).toContain('<a id="whats-in-this-rc"></a>');
      expect(section).toContain('<a id="cherry-picks"></a>');
      expect(section).toContain('git failed for &lt;tag&gt; &amp; branch');
    });
  });
});
