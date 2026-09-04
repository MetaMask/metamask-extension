import type { PageObjectIndex } from './build-index';
import type { UnresolvedSelector } from './extract';
import type { Overlap, OverlapClassification } from './overlaps';
import {
  PAGE_OBJECTS_PREFIX,
  countByClassification,
  filterOverlaps,
  filterUnresolved,
  formatIndexReport,
  formatJson,
  formatOverlapReport,
  shouldFail,
} from './report';

function overlap({
  display,
  classification,
  declarations,
}: {
  display: string;
  classification: OverlapClassification;
  declarations?: Overlap['declarations'];
}): Overlap {
  return {
    key: `${classification}|${display}`,
    display,
    classification,
    declarations: declarations ?? [
      {
        className: 'HomePage',
        relativePath: 'pages/home.ts',
        propertyName: 'toggle',
        line: 10,
      },
      {
        className: 'SendPage',
        relativePath: 'pages/send.ts',
        propertyName: 'toggle',
        line: 20,
      },
    ],
  };
}

function indexFixture(): PageObjectIndex {
  return {
    pageObjects: [
      {
        className: 'HomePage',
        relativePath: 'pages/home.ts',
        extendsClass: null,
        selectors: [
          {
            id: 'HomePage.toggle',
            kind: 'css',
            value: '[data-testid="a"]',
            propertyName: 'toggle',
            line: 10,
            isDynamic: false,
          },
          {
            id: 'HomePage.title',
            kind: 'testId',
            value: 'title',
            propertyName: 'title',
            line: 11,
            isDynamic: false,
          },
        ],
      },
    ],
    overlaps: [
      overlap({
        display: '[data-testid="a"]',
        classification: 'cross-family',
      }),
    ],
    unresolved: [
      {
        relativePath: 'pages/home.ts',
        className: 'HomePage',
        propertyName: 'any',
        line: 12,
        reason: 'unanchored-pattern',
      },
    ],
    summary: {
      files: 1,
      pageObjects: 1,
      selectors: 2,
      unresolved: 1,
      overlaps: 1,
    },
  };
}

describe('filterOverlaps', () => {
  const overlaps = [
    overlap({
      display: '[data-testid="sort-by-networks"]',
      classification: 'sibling',
      declarations: [
        {
          className: 'TokensTab',
          relativePath: 'pages/home/tokens-tab.ts',
          propertyName: 'networksToggle',
          line: 112,
        },
        {
          className: 'DeFiTab',
          relativePath: 'pages/home/defi-tab.ts',
          propertyName: 'networksToggle',
          line: 50,
        },
      ],
    }),
    overlap({
      display: '[data-testid="first-gas-field"]',
      classification: 'shadowing',
    }),
    overlap({
      display: 'button + text "Connect"',
      classification: 'cross-family',
      declarations: [
        {
          className: 'TestDapp',
          relativePath: 'pages/test-dapp.ts',
          propertyName: 'connectDappButton',
          line: 35,
        },
        {
          className: 'SnapInstall',
          relativePath: 'pages/dialog/snap-install.ts',
          propertyName: 'connectButton',
          line: 32,
        },
      ],
    }),
  ];

  const none = {
    filters: [] as OverlapClassification[],
    className: undefined,
    file: undefined,
    search: undefined,
  };

  it('keeps every overlap when no filters are set', () => {
    expect(filterOverlaps(overlaps, none)).toHaveLength(3);
  });

  it('keeps only the requested classifications', () => {
    const filtered = filterOverlaps(overlaps, {
      ...none,
      filters: ['shadowing', 'sibling'],
    });

    expect(filtered.map((item) => item.classification)).toStrictEqual([
      'sibling',
      'shadowing',
    ]);
  });

  it('keeps overlaps whose path contains --file', () => {
    const filtered = filterOverlaps(overlaps, { ...none, file: 'tokens-tab' });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].display).toBe('[data-testid="sort-by-networks"]');
  });

  it('keeps overlaps that mention --class', () => {
    const filtered = filterOverlaps(overlaps, {
      ...none,
      className: 'TestDapp',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].display).toBe('button + text "Connect"');
  });

  it('matches --search against the selector, class, property, or path', () => {
    const filtered = filterOverlaps(overlaps, {
      ...none,
      search: 'SORT-BY-NETWORKS',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].display).toBe('[data-testid="sort-by-networks"]');
  });

  it('requires every provided filter to match', () => {
    const filtered = filterOverlaps(overlaps, {
      filters: ['sibling'],
      className: 'TestDapp',
      file: undefined,
      search: undefined,
    });

    expect(filtered).toStrictEqual([]);
  });
});

describe('filterUnresolved', () => {
  const unresolved: UnresolvedSelector[] = [
    {
      relativePath: 'pages/home.ts',
      className: 'HomePage',
      propertyName: 'any',
      line: 12,
      reason: 'unanchored-pattern',
    },
    {
      relativePath: 'pages/send.ts',
      className: 'SendPage',
      propertyName: 'title',
      line: 4,
      reason: 'uninterpretable-expression',
    },
  ];

  it('keeps unresolved selectors whose path contains --file', () => {
    const filtered = filterUnresolved(unresolved, {
      filters: [],
      className: undefined,
      file: 'send.ts',
      search: undefined,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].className).toBe('SendPage');
  });

  it('matches --search against the reason', () => {
    const filtered = filterUnresolved(unresolved, {
      filters: [],
      className: undefined,
      file: undefined,
      search: 'unanchored',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].propertyName).toBe('any');
  });
});

describe('shouldFail', () => {
  const shadowing = [
    overlap({
      display: '[data-testid="first-gas-field"]',
      classification: 'shadowing',
    }),
  ];

  it('returns false when no fail-on flag is set', () => {
    expect(shouldFail(shadowing, { failOnOverlap: false, failOn: [] })).toBe(
      false,
    );
  });

  it('returns false when the filtered set is empty', () => {
    expect(shouldFail([], { failOnOverlap: true, failOn: ['shadowing'] })).toBe(
      false,
    );
  });

  it('returns true when --fail-on-overlap sees remaining overlaps', () => {
    expect(shouldFail(shadowing, { failOnOverlap: true, failOn: [] })).toBe(
      true,
    );
  });

  it('returns true when a remaining overlap matches --fail-on', () => {
    expect(
      shouldFail(shadowing, { failOnOverlap: false, failOn: ['shadowing'] }),
    ).toBe(true);
  });

  it('returns false when remaining overlaps are outside --fail-on', () => {
    expect(
      shouldFail(shadowing, {
        failOnOverlap: false,
        failOn: ['cross-family'],
      }),
    ).toBe(false);
  });
});

describe('formatIndexReport', () => {
  it('prints sections in dashboard order', () => {
    const index = indexFixture();
    const text = formatIndexReport({
      index,
      overlaps: index.overlaps,
      unresolved: index.unresolved,
      wrote: [
        'development/page-object-inspector/.generated/index.json',
        'ui/dev/page-object-inspector/runtime-index.json',
      ],
      color: false,
      limit: 10,
    }).join('\n');

    const sections = [
      'Page Object Index',
      'WROTE',
      'SUMMARY',
      'OVERLAPS BY CLASS',
      'KINDS',
      'UNRESOLVED (1)',
      'NEXT',
    ];
    const positions = sections.map((section) => text.indexOf(section));

    expect(positions.every((position) => position !== -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toStrictEqual(positions);
  });

  it('lists unresolved selectors with a clickable path', () => {
    const index = indexFixture();
    const text = formatIndexReport({
      index,
      overlaps: index.overlaps,
      unresolved: index.unresolved,
      wrote: ['index.json'],
      color: false,
      limit: 10,
    }).join('\n');

    expect(text).toContain(
      `${PAGE_OBJECTS_PREFIX}pages/home.ts:12  HomePage.any  unanchored-pattern`,
    );
  });

  it('omits ANSI codes when color is disabled', () => {
    const index = indexFixture();
    const text = formatIndexReport({
      index,
      overlaps: index.overlaps,
      unresolved: index.unresolved,
      wrote: ['index.json'],
      color: false,
      limit: 10,
    }).join('\n');

    expect(text).not.toContain('\u001b');
  });

  it('applies ANSI codes when color is enabled', () => {
    const index = indexFixture();
    const text = formatIndexReport({
      index,
      overlaps: index.overlaps,
      unresolved: index.unresolved,
      wrote: ['index.json'],
      color: true,
      limit: 10,
    }).join('\n');

    expect(text).toContain('\u001b');
  });

  it('truncates unresolved selectors and points at --all', () => {
    const index = indexFixture();
    const unresolved = Array.from({ length: 12 }, (_, i) => ({
      relativePath: 'pages/home.ts',
      className: 'HomePage',
      propertyName: `item${i}`,
      line: i + 1,
      reason: 'unanchored-pattern' as const,
    }));

    const text = formatIndexReport({
      index,
      overlaps: [],
      unresolved,
      wrote: ['index.json'],
      color: false,
      limit: 10,
    }).join('\n');

    expect(text).toContain('UNRESOLVED (12)');
    expect(text).toContain('… 2 more. Re-run with --all');
    expect(text).not.toContain('HomePage.item10');
  });
});

describe('formatOverlapReport', () => {
  it('groups overlaps under classification headings', () => {
    const text = formatOverlapReport({
      overlaps: [
        overlap({
          display: 'button + text "Connect"',
          classification: 'cross-family',
        }),
        overlap({
          display: '[data-testid="first-gas-field"]',
          classification: 'shadowing',
        }),
      ],
      color: false,
      limit: 10,
    }).join('\n');

    expect(text).toContain('Page Object Overlaps');
    expect(text).toContain(
      'CROSS-FAMILY — 1 selector(s) — fix: pick a canonical owner or extract a shared page object',
    );
    expect(text).toContain(
      'SHADOWING — 1 selector(s) — fix: delete the subclass copy',
    );
    expect(text.indexOf('CROSS-FAMILY')).toBeLessThan(
      text.indexOf('SHADOWING'),
    );
  });

  it('numbers items and prefixes declarations for click-through', () => {
    const text = formatOverlapReport({
      overlaps: [
        overlap({
          display: '[data-testid="sort-by-networks"]',
          classification: 'sibling',
        }),
      ],
      color: false,
      limit: 10,
    }).join('\n');

    expect(text).toContain('1. [data-testid="sort-by-networks"]');
    expect(text).toContain(
      `${PAGE_OBJECTS_PREFIX}pages/home.ts:10  HomePage.toggle`,
    );
  });

  it('caps each classification and reports the hidden count', () => {
    const overlaps = Array.from({ length: 12 }, (_, i) =>
      overlap({
        display: `[data-testid="item-${i}"]`,
        classification: 'cross-family',
      }),
    );

    const text = formatOverlapReport({
      overlaps,
      color: false,
      limit: 10,
    }).join('\n');

    expect(text).toContain('1. [data-testid="item-0"]');
    expect(text).toContain('10. [data-testid="item-9"]');
    expect(text).not.toContain('[data-testid="item-10"]');
    expect(text).toContain('… 2 more. Re-run with --all');
  });

  it('prints a success line when nothing overlaps', () => {
    const text = formatOverlapReport({
      overlaps: [],
      color: false,
      limit: 10,
    }).join('\n');

    expect(text).toContain('0 overlaps');
    expect(text).toContain('No overlapping selectors found.');
  });
});

describe('formatJson', () => {
  it('emits the full filtered set without applying --limit', () => {
    const index = indexFixture();
    const payload = JSON.parse(
      formatJson({
        command: 'overlaps',
        summary: index.summary,
        overlapCounts: countByClassification(index.overlaps),
        kinds: { css: 1, testId: 1 },
        overlaps: index.overlaps,
        unresolved: index.unresolved,
      }),
    ) as {
      command: string;
      overlaps: Overlap[];
      unresolved: UnresolvedSelector[];
    };

    expect(payload.command).toBe('overlaps');
    expect(payload.overlaps).toHaveLength(1);
    expect(payload.unresolved).toHaveLength(1);
  });
});
