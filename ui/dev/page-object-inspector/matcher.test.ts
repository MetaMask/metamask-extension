import { stampOwnership } from './matcher';
import type { PageObjectIndex, Selector } from './types';

function indexOf(
  ...classes: { className: string; selectors: Selector[] }[]
): PageObjectIndex {
  return {
    pageObjects: classes.map(({ className, selectors }) => ({
      className,
      relativePath: `pages/${className.toLowerCase()}.ts`,
      extendsClass: null,
      selectors,
    })),
  };
}

function selector(partial: Partial<Selector> & { id: string }): Selector {
  return {
    kind: 'css',
    propertyName: partial.id.split('.')[1] ?? 'x',
    line: 1,
    isDynamic: false,
    ...partial,
  };
}

describe('stampOwnership', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('stamps the owning class onto a matched element', () => {
    document.body.innerHTML = '<button data-testid="a"></button>';

    stampOwnership(
      document,
      indexOf({
        className: 'HomePage',
        selectors: [
          selector({ id: 'HomePage.toggle', value: '[data-testid="a"]' }),
        ],
      }),
    );

    const button = document.querySelector('button');
    expect(button?.getAttribute('data-po-owner')).toBe('HomePage');
    expect(button?.getAttribute('data-po-selector-id')).toBe('HomePage.toggle');
  });

  it('leaves unmatched elements unstamped', () => {
    document.body.innerHTML = '<button data-testid="b"></button>';

    stampOwnership(
      document,
      indexOf({
        className: 'HomePage',
        selectors: [
          selector({ id: 'HomePage.toggle', value: '[data-testid="a"]' }),
        ],
      }),
    );

    expect(
      document.querySelector('button')?.hasAttribute('data-po-owner'),
    ).toBe(false);
  });

  it('matches a testId selector', () => {
    document.body.innerHTML = '<div data-testid="import-tokens"></div>';

    stampOwnership(
      document,
      indexOf({
        className: 'TokensTab',
        selectors: [
          selector({
            id: 'TokensTab.loading',
            kind: 'testId',
            value: 'import-tokens',
          }),
        ],
      }),
    );

    expect(document.querySelector('div')?.getAttribute('data-po-owner')).toBe(
      'TokensTab',
    );
  });

  it('matches a compound selector anchored on a test id', () => {
    document.body.innerHTML = '<div data-testid="name-input"><input /></div>';

    stampOwnership(
      document,
      indexOf({
        className: 'AccountDetails',
        selectors: [
          selector({
            id: 'AccountDetails.input',
            value: '[data-testid="name-input"] input',
          }),
        ],
      }),
    );

    expect(document.querySelector('input')?.getAttribute('data-po-owner')).toBe(
      'AccountDetails',
    );
  });

  it('matches a dynamic test id by its literal prefix and suffix', () => {
    document.body.innerHTML =
      '<div data-testid="network-list-item-mainnet"></div>' +
      '<div data-testid="unrelated"></div>';

    stampOwnership(
      document,
      indexOf({
        className: 'NetworkManager',
        selectors: [
          selector({
            id: 'NetworkManager.item',
            chunks: ['[data-testid="network-list-item-', '"]'],
            params: ['name'],
            isDynamic: true,
          }),
        ],
      }),
    );

    expect(
      document
        .querySelector('[data-testid="network-list-item-mainnet"]')
        ?.getAttribute('data-po-owner'),
    ).toBe('NetworkManager');
    expect(
      document
        .querySelector('[data-testid="unrelated"]')
        ?.hasAttribute('data-po-owner'),
    ).toBe(false);
  });

  it('marks an element claimed by two different classes as conflicting', () => {
    document.body.innerHTML = '<button data-testid="a" class="x"></button>';

    stampOwnership(
      document,
      indexOf(
        {
          className: 'HomePage',
          selectors: [
            selector({ id: 'HomePage.toggle', value: '[data-testid="a"]' }),
          ],
        },
        {
          className: 'NetworkManager',
          selectors: [
            selector({
              id: 'NetworkManager.toggle',
              value: 'button[data-testid="a"]',
            }),
          ],
        },
      ),
    );

    const button = document.querySelector('button');
    expect(button?.getAttribute('data-po-conflict')).toBe(
      'HomePage,NetworkManager',
    );
  });

  it('does not treat a nested child and its container as a conflict', () => {
    document.body.innerHTML =
      '<div data-testid="container"><button data-testid="child"></button></div>';

    stampOwnership(
      document,
      indexOf(
        {
          className: 'HomePage',
          selectors: [
            selector({
              id: 'HomePage.container',
              value: '[data-testid="container"]',
            }),
          ],
        },
        {
          className: 'TokensTab',
          selectors: [
            selector({
              id: 'TokensTab.child',
              value: '[data-testid="child"]',
            }),
          ],
        },
      ),
    );

    expect(
      document
        .querySelector('[data-testid="container"]')
        ?.hasAttribute('data-po-conflict'),
    ).toBe(false);
    expect(
      document
        .querySelector('[data-testid="child"]')
        ?.hasAttribute('data-po-conflict'),
    ).toBe(false);
  });

  it('does not flag two selectors from the same class as a conflict', () => {
    document.body.innerHTML = '<button data-testid="a" class="x"></button>';

    stampOwnership(
      document,
      indexOf({
        className: 'HomePage',
        selectors: [
          selector({ id: 'HomePage.one', value: '[data-testid="a"]' }),
          selector({ id: 'HomePage.two', value: 'button[data-testid="a"]' }),
        ],
      }),
    );

    expect(
      document.querySelector('button')?.hasAttribute('data-po-conflict'),
    ).toBe(false);
  });

  it('survives a malformed selector and reports it', () => {
    document.body.innerHTML = '<button data-testid="a"></button>';

    const result = stampOwnership(
      document,
      indexOf({
        className: 'HomePage',
        selectors: [
          selector({ id: 'HomePage.bad', value: '[[[not-valid' }),
          selector({ id: 'HomePage.good', value: '[data-testid="a"]' }),
        ],
      }),
    );

    expect(result.failed).toBe(1);
    expect(
      document.querySelector('button')?.getAttribute('data-po-owner'),
    ).toBe('HomePage');
  });

  it('clears stamps from a previous pass', () => {
    document.body.innerHTML = '<button data-testid="a"></button>';
    const index = indexOf({
      className: 'HomePage',
      selectors: [
        selector({ id: 'HomePage.toggle', value: '[data-testid="a"]' }),
      ],
    });

    stampOwnership(document, index);
    document.querySelector('button')?.setAttribute('data-testid', 'b');
    stampOwnership(document, index);

    expect(
      document.querySelector('button')?.hasAttribute('data-po-owner'),
    ).toBe(false);
  });

  it('ignores the inspector\u2019s own UI', () => {
    document.body.innerHTML =
      '<div data-po-inspector><button data-testid="a"></button></div>' +
      '<button data-testid="a"></button>';

    const result = stampOwnership(
      document,
      indexOf({
        className: 'HomePage',
        selectors: [
          selector({ id: 'HomePage.toggle', value: '[data-testid="a"]' }),
        ],
      }),
    );

    expect(result.stamped).toBe(1);
    expect(
      document
        .querySelector('[data-po-inspector] button')
        ?.hasAttribute('data-po-owner'),
    ).toBe(false);
  });

  it('reports how many elements it stamped', () => {
    document.body.innerHTML =
      '<button data-testid="a"></button><button data-testid="b"></button>';

    const result = stampOwnership(
      document,
      indexOf({
        className: 'HomePage',
        selectors: [
          selector({ id: 'HomePage.a', value: '[data-testid="a"]' }),
          selector({ id: 'HomePage.b', value: '[data-testid="b"]' }),
        ],
      }),
    );

    expect(result.stamped).toBe(2);
  });

  it('matches tagText, text, cssText, and xpath selectors', () => {
    document.body.innerHTML =
      '<button>Buy</button><span>Only this</span><a class="btn">Continue</a>';

    const result = stampOwnership(
      document,
      indexOf(
        {
          className: 'BuyPage',
          selectors: [
            selector({
              id: 'BuyPage.buy',
              kind: 'tagText',
              value: 'button',
              text: 'Buy',
            }),
          ],
        },
        {
          className: 'TextPage',
          selectors: [
            selector({
              id: 'TextPage.only',
              kind: 'text',
              text: 'Only this',
            }),
          ],
        },
        {
          className: 'LinkPage',
          selectors: [
            selector({
              id: 'LinkPage.continue',
              kind: 'cssText',
              value: 'a.btn',
              text: 'Continue',
            }),
          ],
        },
      ),
    );

    expect(result.stamped).toBe(3);
    expect(
      document.querySelector('button')?.getAttribute('data-po-owner'),
    ).toBe('BuyPage');
  });

  it('matches an xpath selector', () => {
    document.body.innerHTML = '<h1 id="title">Hello</h1>';

    stampOwnership(
      document,
      indexOf({
        className: 'HeaderPage',
        selectors: [
          selector({
            id: 'HeaderPage.title',
            kind: 'xpath',
            value: '//h1[@id="title"]',
          }),
        ],
      }),
    );

    expect(document.querySelector('h1')?.getAttribute('data-po-owner')).toBe(
      'HeaderPage',
    );
  });

  it('reports unsupported selectors it cannot run', () => {
    const result = stampOwnership(
      document,
      indexOf({
        className: 'HomePage',
        selectors: [
          selector({
            id: 'HomePage.dynamic',
            chunks: ['foo', 'bar', 'baz'],
            isDynamic: true,
          }),
          selector({ id: 'HomePage.xpath', kind: 'xpath' }),
          selector({ id: 'HomePage.tag', kind: 'tagText', value: 'button' }),
          selector({ id: 'HomePage.text', kind: 'text' }),
          selector({ id: 'HomePage.cssText', kind: 'cssText', value: '.x' }),
        ],
      }),
    );

    expect(result.unsupported).toBe(5);
  });

  it('rewrites a dynamic testId and a prefix-only attribute selector', () => {
    document.body.innerHTML =
      '<div data-testid="item-mainnet"></div><input name="amount" />';

    stampOwnership(
      document,
      indexOf(
        {
          className: 'ListPage',
          selectors: [
            selector({
              id: 'ListPage.item',
              kind: 'testId',
              chunks: ['item-', ''],
              params: ['name'],
              isDynamic: true,
            }),
          ],
        },
        {
          className: 'FormPage',
          selectors: [
            selector({
              id: 'FormPage.amount',
              chunks: ['[name="', '"]'],
              params: ['field'],
              isDynamic: true,
            }),
          ],
        },
      ),
    );

    expect(
      document
        .querySelector('[data-testid="item-mainnet"]')
        ?.getAttribute('data-po-owner'),
    ).toBe('ListPage');
    expect(document.querySelector('input')?.getAttribute('data-po-owner')).toBe(
      'FormPage',
    );
  });

  it('marks selectors that match many elements as viewport wrappers', () => {
    document.body.innerHTML = Array.from(
      { length: 6 },
      (_, index) => `<span data-testid="row-${index}"></span>`,
    ).join('');

    stampOwnership(
      document,
      indexOf({
        className: 'ListPage',
        selectors: [
          selector({
            id: 'ListPage.row',
            value: 'span',
          }),
        ],
      }),
    );

    expect(
      document.querySelector('span')?.hasAttribute('data-po-viewport'),
    ).toBe(true);
  });
});
