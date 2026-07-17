import { execFileSync } from 'child_process';

import {
  buildWhatsInRcFailureSection,
  buildWhatsInRcSection,
  extractWhatsInRc,
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
          'describe --tags --abbrev=0 --match v[0-9]*.[0-9]*.[0-9]* --exclude *-* merge-base-sha^':
            'v13.35.1\n',
          'log --format=%h %s merge-base-sha..HEAD':
            'abc1234 fix: cherry-pick (#123)\n',
          'log --format=%h %s v13.35.1..merge-base-sha':
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
      });
      expect(gitCalls[1]).toStrictEqual([
        'describe',
        '--tags',
        '--abbrev=0',
        '--match',
        'v[0-9]*.[0-9]*.[0-9]*',
        '--exclude',
        '*-*',
        'merge-base-sha^',
      ]);
    });

    it('throws when the previous release tag cannot be found', () => {
      mockGit({
        'merge-base HEAD origin/main': 'merge-base-sha\n',
        'describe --tags --abbrev=0 --match v[0-9]*.[0-9]*.[0-9]* --exclude *-* merge-base-sha^':
          new Error('no matching tag'),
      });

      expect(() => extractWhatsInRc()).toThrow(
        'Unable to find previous release tag before merge base merge-base-sha',
      );
    });

    it('throws when a git log command fails', () => {
      mockGit({
        'merge-base HEAD origin/main': 'merge-base-sha\n',
        'describe --tags --abbrev=0 --match v[0-9]*.[0-9]*.[0-9]* --exclude *-* merge-base-sha^':
          'v13.35.1\n',
        'log --format=%h %s merge-base-sha..HEAD': new Error('git log failed'),
      });

      expect(() => extractWhatsInRc()).toThrow('git log failed');
    });
  });

  describe('buildWhatsInRcSection', () => {
    it('builds a stable run-specific anchor id', () => {
      expect(getWhatsInRcAnchorId()).toBe('whats-in-this-rc');
      expect(getWhatsInRcAnchorId('28063612297')).toBe(
        'whats-in-this-rc-28063612297',
      );
      expect(getWhatsInRcAnchorId('Run 123 / RC')).toBe(
        'whats-in-this-rc-run-123-rc',
      );
    });

    it('renders the stable section anchor when no commits are found', () => {
      const section = buildWhatsInRcSection({
        cherryPicks: [],
        changelog: [],
        mergeBase: 'merge-base-sha',
        previousTag: 'v13.35.1',
      });

      expect(section).toContain('<a id="whats-in-this-rc"></a>');
      expect(section).toContain('No cherry-picks or changelog commits found.');
      expect(section).not.toContain('<a id="cherry-picks"></a>');
    });

    it('renders a run-specific section anchor when a suffix is provided', () => {
      const section = buildWhatsInRcSection(
        {
          cherryPicks: [],
          changelog: [],
          mergeBase: 'merge-base-sha',
          previousTag: 'v13.35.1',
        },
        '28063612297',
      );

      expect(section).toContain('<a id="whats-in-this-rc-28063612297"></a>');
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
      expect(section).toContain('git failed for &lt;tag&gt; &amp; branch');
    });
  });
});
