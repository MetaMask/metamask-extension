import { isGoodLocator } from './locator';
import type { Selector } from './types';

function selector(partial: Partial<Selector> & { id: string }): Selector {
  return {
    kind: 'css',
    propertyName: 'el',
    line: 1,
    isDynamic: false,
    ...partial,
  };
}

describe('isGoodLocator', () => {
  it('treats testId locators as good', () => {
    expect(
      isGoodLocator(
        selector({ id: 'Home.btn', kind: 'testId', value: 'home-btn' }),
      ),
    ).toBe(true);
  });

  it('treats css that targets data-testid as good', () => {
    expect(
      isGoodLocator(
        selector({
          id: 'Home.btn',
          kind: 'css',
          value: '[data-testid="home-btn"]',
        }),
      ),
    ).toBe(true);
  });

  it('treats generic css as not good', () => {
    expect(
      isGoodLocator(
        selector({ id: 'Home.box', kind: 'css', value: '.mm-box' }),
      ),
    ).toBe(false);
  });

  it('treats xpath, tagText, and cssText as not good', () => {
    expect(
      isGoodLocator(selector({ id: 'a', kind: 'xpath', value: '//button' })),
    ).toBe(false);
    expect(
      isGoodLocator(
        selector({ id: 'b', kind: 'tagText', value: 'button', text: 'Buy' }),
      ),
    ).toBe(false);
    expect(
      isGoodLocator(
        selector({
          id: 'c',
          kind: 'cssText',
          value: '.btn',
          text: 'Continue',
        }),
      ),
    ).toBe(false);
  });
});
