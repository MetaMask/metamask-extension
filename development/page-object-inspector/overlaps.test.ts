import type { PageObject } from './extract';
import { detectOverlaps } from './overlaps';

function pageObject(
  className: string,
  extendsClass: string | null,
  selectorValues: Record<string, string>,
): PageObject {
  return {
    className,
    relativePath: `pages/${className.toLowerCase()}.ts`,
    extendsClass,
    selectors: Object.entries(selectorValues).map(
      ([propertyName, value], index) => ({
        id: `${className}.${propertyName}`,
        kind: 'css' as const,
        value,
        propertyName,
        line: index + 1,
        isDynamic: false,
      }),
    ),
  };
}

describe('detectOverlaps', () => {
  it('reports nothing when every selector is declared once', () => {
    const overlaps = detectOverlaps([
      pageObject('HomePage', null, { toggle: '[data-testid="a"]' }),
      pageObject('SendPage', null, { button: '[data-testid="b"]' }),
    ]);

    expect(overlaps).toStrictEqual([]);
  });

  it('ignores a selector reused within a single class', () => {
    const overlaps = detectOverlaps([
      pageObject('HomePage', null, {
        toggle: '[data-testid="a"]',
        alias: '[data-testid="a"]',
      }),
    ]);

    expect(overlaps).toStrictEqual([]);
  });

  it('classifies a subclass redeclaring its parent selector as shadowing', () => {
    const overlaps = detectOverlaps([
      pageObject('HomePage', null, { toggle: '[data-testid="a"]' }),
      pageObject('TokensTab', 'HomePage', { toggle: '[data-testid="a"]' }),
    ]);

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].classification).toBe('shadowing');
    expect(overlaps[0].declarations.map((d) => d.className)).toStrictEqual([
      'HomePage',
      'TokensTab',
    ]);
  });

  it('classifies two siblings declaring the same selector as sibling duplication', () => {
    const overlaps = detectOverlaps([
      pageObject('HomePage', null, {}),
      pageObject('TokensTab', 'HomePage', { toggle: '[data-testid="a"]' }),
      pageObject('DeFiTab', 'HomePage', { toggle: '[data-testid="a"]' }),
    ]);

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].classification).toBe('sibling');
  });

  it('classifies unrelated classes declaring the same selector as cross-family', () => {
    const overlaps = detectOverlaps([
      pageObject('NetworkManager', null, { toggle: '[data-testid="a"]' }),
      pageObject('HomeNetworkFilter', null, { toggle: '[data-testid="a"]' }),
    ]);

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].classification).toBe('cross-family');
  });

  it('reports the most severe relationship when a group mixes several', () => {
    const overlaps = detectOverlaps([
      pageObject('HomePage', null, {}),
      pageObject('TokensTab', 'HomePage', { toggle: '[data-testid="a"]' }),
      pageObject('DeFiTab', 'HomePage', { toggle: '[data-testid="a"]' }),
      pageObject('NetworkManager', null, { toggle: '[data-testid="a"]' }),
    ]);

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].classification).toBe('cross-family');
    expect(overlaps[0].declarations).toHaveLength(3);
  });

  it('carries a human-readable label for the duplicated selector', () => {
    const overlaps = detectOverlaps([
      pageObject('A', null, { x: '[data-testid="sort-by-networks"]' }),
      pageObject('B', null, { y: '[data-testid="sort-by-networks"]' }),
    ]);

    expect(overlaps[0].display).toBe('[data-testid="sort-by-networks"]');
  });

  it('labels a text-bearing selector with both parts', () => {
    const withText = (className: string) => ({
      ...pageObject(className, null, {}),
      selectors: [
        {
          id: `${className}.title`,
          kind: 'tagText' as const,
          value: 'h6',
          text: 'Token imported',
          propertyName: 'title',
          line: 1,
          isDynamic: false,
        },
      ],
    });

    const overlaps = detectOverlaps([withText('A'), withText('B')]);

    expect(overlaps[0].display).toBe('h6 + text "Token imported"');
  });

  it('labels a dynamic selector with its hole names', () => {
    const dynamic = (className: string) => ({
      ...pageObject(className, null, {}),
      selectors: [
        {
          id: `${className}.item`,
          kind: 'css' as const,
          chunks: ['[data-testid="item-', '"]'],
          params: ['name'],
          propertyName: 'item',
          line: 1,
          isDynamic: true,
        },
      ],
    });

    const overlaps = detectOverlaps([dynamic('A'), dynamic('B')]);

    expect(overlaps[0].display).toBe(`[data-testid="item-\${name}"]`);
  });

  it('does not collapse selectors that share a tag but differ by computed text', () => {
    const withComputedText = (className: string, expression: string) => ({
      ...pageObject(className, null, {}),
      selectors: [
        {
          id: `${className}.section`,
          kind: 'cssText' as const,
          value: 'p',
          textExpression: expression,
          propertyName: 'section',
          line: 1,
          isDynamic: true,
        },
      ],
    });

    const overlaps = detectOverlaps([
      withComputedText('A', "tEn('interactingWith')"),
      withComputedText('B', "tEn('methodData')"),
    ]);

    expect(overlaps).toStrictEqual([]);
  });

  it('still reports selectors sharing the same computed text', () => {
    const withComputedText = (className: string) => ({
      ...pageObject(className, null, {}),
      selectors: [
        {
          id: `${className}.section`,
          kind: 'cssText' as const,
          value: 'p',
          textExpression: "tEn('interactingWith')",
          propertyName: 'section',
          line: 1,
          isDynamic: true,
        },
      ],
    });

    const overlaps = detectOverlaps([
      withComputedText('A'),
      withComputedText('B'),
    ]);

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].display).toBe('p + text tEn(\'interactingWith\')');
  });

  it('distinguishes selectors that differ only by kind', () => {
    const overlaps = detectOverlaps([
      {
        ...pageObject('A', null, {}),
        selectors: [
          {
            id: 'A.x',
            kind: 'testId',
            value: 'shared',
            propertyName: 'x',
            line: 1,
            isDynamic: false,
          },
        ],
      },
      {
        ...pageObject('B', null, {}),
        selectors: [
          {
            id: 'B.x',
            kind: 'css',
            value: 'shared',
            propertyName: 'x',
            line: 1,
            isDynamic: false,
          },
        ],
      },
    ]);

    expect(overlaps).toStrictEqual([]);
  });

  it('treats dynamic selectors with identical chunks as overlapping', () => {
    const dynamic = (className: string) => ({
      ...pageObject(className, null, {}),
      selectors: [
        {
          id: `${className}.item`,
          kind: 'css' as const,
          chunks: ['[data-testid="item-', '"]'],
          params: ['name'],
          propertyName: 'item',
          line: 1,
          isDynamic: true,
        },
      ],
    });

    const overlaps = detectOverlaps([dynamic('A'), dynamic('B')]);

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].classification).toBe('cross-family');
  });
});
