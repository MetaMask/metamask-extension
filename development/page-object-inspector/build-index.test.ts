import { buildIndex, toRuntimeIndex } from './build-index';

describe('buildIndex selector filtering', () => {
  function kindsFor(sourceText: string) {
    return buildIndex({
      files: [{ relativePath: 'pages/a.ts', sourceText }],
    }).pageObjects.flatMap((pageObject) =>
      pageObject.selectors.map((selector) => selector.propertyName),
    );
  }

  it('keeps a selector written as a bare test id', () => {
    expect(
      kindsFor(`class A {
        private readonly kept = { testId: 'submit' };
      }`),
    ).toStrictEqual(['kept']);
  });

  it('keeps a css selector that targets a test id', () => {
    expect(
      kindsFor(`class A {
        private readonly kept = '[data-testid="submit"]';
      }`),
    ).toStrictEqual(['kept']);
  });

  it('keeps a compound css selector anchored on a test id', () => {
    expect(
      kindsFor(`class A {
        private readonly kept = '[data-testid="name-input"] input';
      }`),
    ).toStrictEqual(['kept']);
  });

  it('keeps a dynamic selector whose pattern contains a test id', () => {
    expect(
      kindsFor(`class A {
  private readonly kept = (n: string) => \`[data-testid="item-\${n}"]\`;
}`),
    ).toStrictEqual(['kept']);
  });

  it('drops a css selector with no test id', () => {
    expect(
      kindsFor(`class A {
        private readonly dropped = '.mm-button-primary';
      }`),
    ).toStrictEqual([]);
  });

  it('drops selectors that depend on matching text', () => {
    expect(
      kindsFor(`class A {
        private readonly a = { tag: 'h6', text: 'Token imported' };
        private readonly b = { css: '[data-testid="x"]', text: 'Confirm' };
        private readonly c = { text: 'Cancel' };
      }`),
    ).toStrictEqual([]);
  });

  it('drops xpath selectors', () => {
    expect(
      kindsFor(`class A {
        private readonly dropped = { xpath: '//*[@data-testid="x"]' };
      }`),
    ).toStrictEqual([]);
  });

  it('counts only the kept selectors in the summary', () => {
    const index = buildIndex({
      files: [
        {
          relativePath: 'pages/a.ts',
          sourceText: `class A {
            private readonly kept = '[data-testid="submit"]';
            private readonly dropped = '.mm-button';
          }`,
        },
      ],
    });

    expect(index.summary.selectors).toBe(1);
  });
});

describe('toRuntimeIndex', () => {
  it('keeps only the fields the browser overlay needs', () => {
    const index = buildIndex({
      files: [
        {
          relativePath: 'pages/a.ts',
          sourceText: `class A extends B {
            private readonly a = '[data-testid="a"]';
          }`,
        },
      ],
    });

    expect(toRuntimeIndex(index)).toStrictEqual({
      pageObjects: [
        {
          className: 'A',
          relativePath: 'pages/a.ts',
          selectors: [
            {
              id: 'A.a',
              kind: 'css',
              value: '[data-testid="a"]',
              propertyName: 'a',
              line: 2,
            },
          ],
        },
      ],
    });
  });

  it('keeps the chunks and params of a dynamic selector', () => {
    const index = buildIndex({
      files: [
        {
          relativePath: 'pages/a.ts',
          sourceText: `class A {
  private readonly item = (name: string) => \`[data-testid="item-\${name}"]\`;
}`,
        },
      ],
    });

    expect(toRuntimeIndex(index).pageObjects[0].selectors[0]).toStrictEqual({
      id: 'A.item',
      kind: 'css',
      chunks: ['[data-testid="item-', '"]'],
      params: ['name'],
      propertyName: 'item',
      line: 2,
    });
  });
});

describe('buildIndex', () => {
  it('aggregates page objects from every file', () => {
    const index = buildIndex({
      files: [
        {
          relativePath: 'pages/home/homepage.ts',
          sourceText: `class HomePage {
            private readonly a = '[data-testid="a"]';
          }`,
        },
        {
          relativePath: 'pages/send/send-page.ts',
          sourceText: `class SendPage {
            private readonly b = '[data-testid="b"]';
          }`,
        },
      ],
    });

    expect(index.pageObjects.map((p) => p.className)).toStrictEqual([
      'HomePage',
      'SendPage',
    ]);
  });

  it('collects unresolved selectors from every file', () => {
    const index = buildIndex({
      files: [
        {
          relativePath: 'pages/a.ts',
          sourceText: `class A {
  private readonly any = (n: string) => \`[data-testid="\${n}"]\`;
}`,
        },
      ],
    });

    expect(index.unresolved).toStrictEqual([
      {
        relativePath: 'pages/a.ts',
        className: 'A',
        propertyName: 'any',
        line: 2,
        reason: 'unanchored-pattern',
      },
    ]);
  });

  it('detects overlaps spanning two files', () => {
    const index = buildIndex({
      files: [
        {
          relativePath: 'pages/network-manager.ts',
          sourceText: `class NetworkManager {
            private readonly toggle = '[data-testid="sort-by-networks"]';
          }`,
        },
        {
          relativePath: 'pages/home-network-filter.ts',
          sourceText: `class HomeNetworkFilter {
            private readonly networksToggle = '[data-testid="sort-by-networks"]';
          }`,
        },
      ],
    });

    expect(index.overlaps).toHaveLength(1);
    expect(index.overlaps[0].classification).toBe('cross-family');
    expect(index.overlaps[0].declarations.map((d) => d.relativePath)).toStrictEqual([
      'pages/network-manager.ts',
      'pages/home-network-filter.ts',
    ]);
  });

  it('resolves inheritance across file boundaries', () => {
    const index = buildIndex({
      files: [
        {
          relativePath: 'pages/home/homepage.ts',
          sourceText: `class HomePage {
            private readonly toggle = '[data-testid="a"]';
          }`,
        },
        {
          relativePath: 'pages/home/tokens-tab.ts',
          sourceText: `class TokensTab extends HomePage {
            private readonly toggle = '[data-testid="a"]';
          }`,
        },
      ],
    });

    expect(index.overlaps[0].classification).toBe('shadowing');
  });

  it('summarises coverage so the report can show progress', () => {
    const index = buildIndex({
      files: [
        {
          relativePath: 'pages/a.ts',
          sourceText: `class A {
            private readonly a = '[data-testid="a"]';
            private readonly b = '[data-testid="b"]';
            private readonly any = (n: string) => \`[data-testid="\${n}"]\`;
          }`,
        },
      ],
    });

    expect(index.summary).toStrictEqual({
      files: 1,
      pageObjects: 1,
      selectors: 2,
      unresolved: 1,
      overlaps: 0,
    });
  });
});
