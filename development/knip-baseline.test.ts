/**
 * Unit tests for the pure logic in knip-baseline.ts. The knip process itself
 * is not spawned here — only report normalization, diffing and formatting are
 * exercised.
 */
import {
  compareEntries,
  diffFindings,
  formatEntry,
  groupEntriesByOwner,
  normalizeReport,
} from './knip-baseline';

describe('compareEntries', () => {
  it('sorts by issue type order before sorting entries of the same type', () => {
    const sorted = [
      'unlisted|a.ts|pkg',
      'dependencies|package.json|b-pkg',
      'files|z.ts',
      'dependencies|package.json|a-pkg',
      'files|a.ts',
    ].sort(compareEntries);

    expect(sorted).toStrictEqual([
      'files|a.ts',
      'files|z.ts',
      'dependencies|package.json|a-pkg',
      'dependencies|package.json|b-pkg',
      'unlisted|a.ts|pkg',
    ]);
  });

  it('places unknown future issue types after known ones, sorted by name', () => {
    const sorted = ['zeta|f.ts|z', 'alpha|f.ts|a', 'cycles|f.ts|c'].sort(
      compareEntries,
    );

    expect(sorted).toStrictEqual([
      'cycles|f.ts|c',
      'alpha|f.ts|a',
      'zeta|f.ts|z',
    ]);
  });
});

describe('normalizeReport', () => {
  it('keys unused files by the flagged file itself', () => {
    const { entries } = normalizeReport([
      {
        file: 'ui/components/ui/icon/icon-times.js',
        owners: [{ name: '@MetaMask/extension-platform' }],
        files: [{ name: 'ui/components/ui/icon/icon-times.js' }],
        dependencies: [],
        unlisted: [],
      },
    ]);

    expect(entries).toStrictEqual([
      'files|ui/components/ui/icon/icon-times.js',
    ]);
  });

  it('keys dependency and unlisted findings by file and symbol', () => {
    const { entries } = normalizeReport([
      {
        file: 'package.json',
        dependencies: [
          {
            name: '@fortawesome/fontawesome-free',
            line: 364,
            col: 6,
            pos: 26311,
          },
        ],
        files: [],
        unlisted: [],
      },
      {
        file: 'app/scripts/metamask-controller.test.js',
        dependencies: [],
        files: [],
        unlisted: [{ name: 'ulid' }],
      },
    ]);

    expect(entries).toStrictEqual([
      'dependencies|package.json|@fortawesome/fontawesome-free',
      'unlisted|app/scripts/metamask-controller.test.js|ulid',
    ]);
  });

  it('drops line numbers from the baseline key but records them for annotations', () => {
    const { entries, linesByEntry } = normalizeReport([
      {
        file: 'package.json',
        dependencies: [
          { name: 'base32-encode', line: 535, col: 6, pos: 38857 },
        ],
        files: [],
        unlisted: [],
      },
    ]);

    expect(entries).toStrictEqual(['dependencies|package.json|base32-encode']);
    expect(entries[0]).not.toContain('535');
    expect(linesByEntry.get('dependencies|package.json|base32-encode')).toBe(
      535,
    );
  });

  it('skips malformed symbols instead of throwing', () => {
    const { entries } = normalizeReport([
      {
        file: 'package.json',
        dependencies: [undefined, { name: 'chalk' }] as never,
        files: [],
        unlisted: [],
      },
    ]);

    expect(entries).toStrictEqual(['dependencies|package.json|chalk']);
  });

  it('returns a sorted, deduplicated entry list', () => {
    const { entries } = normalizeReport([
      {
        file: 'b.ts',
        files: [{ name: 'b.ts' }],
        dependencies: [],
        unlisted: [],
      },
      {
        file: 'a.ts',
        files: [{ name: 'a.ts' }],
        dependencies: [],
        unlisted: [],
      },
      {
        file: 'a.ts',
        files: [{ name: 'a.ts' }],
        dependencies: [],
        unlisted: [],
      },
    ]);

    expect(entries).toStrictEqual(['files|a.ts', 'files|b.ts']);
  });

  it('orders known issue types first and sorts unknown future types after them', () => {
    const { entries } = normalizeReport([
      {
        file: 'f.ts',
        files: [],
        unlisted: [{ name: 'z-package' }],
        zeta: [{ name: 'z' }],
        exports: [{ name: 'unusedExport' }],
      },
    ]);

    expect(entries).toStrictEqual([
      'unlisted|f.ts|z-package',
      'exports|f.ts|unusedExport',
      'zeta|f.ts|z',
    ]);
  });

  it('records the CODEOWNERS teams resolved by knip for each entry', () => {
    const { ownersByEntry } = normalizeReport([
      {
        file: 'ui/pages/deep-link/index.ts',
        owners: [{ name: '@MetaMask/extension-security-team' }],
        files: [{ name: 'ui/pages/deep-link/index.ts' }],
        dependencies: [],
        unlisted: [],
      },
      {
        file: 'app/scripts/disable-console.ts',
        owners: [],
        files: [{ name: 'app/scripts/disable-console.ts' }],
        dependencies: [],
        unlisted: [],
      },
    ]);

    expect(
      ownersByEntry.get('files|ui/pages/deep-link/index.ts'),
    ).toStrictEqual(['@MetaMask/extension-security-team']);
    expect(ownersByEntry.has('files|app/scripts/disable-console.ts')).toBe(
      false,
    );
  });
});

describe('diffFindings', () => {
  it('reports added and removed findings in both directions', () => {
    const { added, removed } = diffFindings(
      ['files|a.ts', 'files|b.ts'],
      ['files|b.ts', 'files|c.ts'],
    );

    expect(added).toStrictEqual(['files|a.ts']);
    expect(removed).toStrictEqual(['files|c.ts']);
  });

  it('reports no differences when both sides match', () => {
    const { added, removed } = diffFindings(['files|a.ts'], ['files|a.ts']);

    expect(added).toStrictEqual([]);
    expect(removed).toStrictEqual([]);
  });

  it('treats an empty baseline as all-new findings', () => {
    const { added, removed } = diffFindings(['files|a.ts'], []);

    expect(added).toStrictEqual(['files|a.ts']);
    expect(removed).toStrictEqual([]);
  });
});

describe('groupEntriesByOwner', () => {
  it('groups entries by their resolved CODEOWNERS teams', () => {
    const grouped = groupEntriesByOwner(
      ['files|b.ts', 'files|a.ts', 'files|c.ts'],
      new Map([
        ['files|a.ts', ['@MetaMask/perps']],
        ['files|b.ts', ['@MetaMask/perps']],
      ]),
    );

    expect([...grouped.entries()]).toStrictEqual([
      ['@MetaMask/perps', ['files|a.ts', 'files|b.ts']],
      ['[no-owner]', ['files|c.ts']],
    ]);
  });

  it('keeps entries with multiple owners under a joined key and sorts owners', () => {
    const grouped = groupEntriesByOwner(
      ['files|a.ts', 'files|b.ts'],
      new Map([
        ['files|b.ts', ['@MetaMask/delegation', '@MetaMask/perps']],
        ['files|a.ts', ['@MetaMask/perps']],
      ]),
    );

    expect([...grouped.keys()]).toStrictEqual([
      '@MetaMask/delegation, @MetaMask/perps',
      '@MetaMask/perps',
    ]);
  });
});

describe('formatEntry', () => {
  it('prints a file finding as its path', () => {
    expect(formatEntry('files|app/scripts/runtime-cjs.ts')).toBe(
      'app/scripts/runtime-cjs.ts',
    );
  });

  it('prints a dependency finding as the package name', () => {
    expect(formatEntry('dependencies|package.json|base32-encode')).toBe(
      'base32-encode',
    );
  });

  it('prints an unlisted finding as symbol and importing file', () => {
    expect(
      formatEntry('unlisted|app/scripts/metamask-controller.test.js|ulid'),
    ).toBe('ulid (in app/scripts/metamask-controller.test.js)');
  });
});
