import type { Driver } from '../../webdriver/driver';
import {
  isAccountListRenderComplete,
  isSwapPageRenderComplete,
  waitForAccountListRenderComplete,
  waitForSwapPageRenderComplete,
} from './render-complete';

function createMockDriver(): Driver {
  return {
    waitForFunction: jest.fn().mockResolvedValue(true),
  } as unknown as Driver;
}

describe('benchmark render-complete helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('isAccountListRenderComplete', () => {
    it('returns true once the expected number of account rows are rendered', () => {
      document.body.innerHTML = `
        <div data-testid="account-item"></div>
        <div data-testid="account-item"></div>
      `;

      expect(isAccountListRenderComplete(2)).toBe(true);
    });

    it('returns false when the expected number of account rows are missing', () => {
      document.body.innerHTML = '<div data-testid="account-item"></div>';

      expect(isAccountListRenderComplete(2)).toBe(false);
    });
  });

  describe('waitForAccountListRenderComplete', () => {
    it('delegates to driver.waitForFunction with the expected count', async () => {
      const driver = createMockDriver();

      await waitForAccountListRenderComplete({
        driver,
        expectedCount: 30,
        stableFor: 500,
        timeout: 120000,
      });

      expect(driver.waitForFunction).toHaveBeenCalledWith(
        isAccountListRenderComplete,
        {
          args: [30],
          stableFor: 500,
          timeout: 120000,
        },
      );
    });
  });

  describe('isSwapPageRenderComplete', () => {
    it('returns true when the token selector, amount input, and quote details are rendered', () => {
      document.body.innerHTML = `
        <button data-testid="bridge-source-button">ETH</button>
        <input data-testid="from-amount" />
        <div data-testid="network-fees"></div>
        <div data-testid="minimum-received"></div>
        <button data-testid="slippage-edit-button"></button>
      `;

      expect(isSwapPageRenderComplete()).toBe(true);
    });

    it('returns false while the quote input is still disabled', () => {
      document.body.innerHTML = `
        <button data-testid="bridge-source-button">ETH</button>
        <input data-testid="from-amount" disabled />
        <div data-testid="network-fees"></div>
        <div data-testid="minimum-received"></div>
        <button data-testid="slippage-edit-button"></button>
      `;

      expect(isSwapPageRenderComplete()).toBe(false);
    });
  });

  describe('waitForSwapPageRenderComplete', () => {
    it('delegates to driver.waitForFunction for the swap render predicate', async () => {
      const driver = createMockDriver();

      await waitForSwapPageRenderComplete({ driver, timeout: 45000 });

      expect(driver.waitForFunction).toHaveBeenCalledWith(
        isSwapPageRenderComplete,
        {
          timeout: 45000,
        },
      );
    });
  });
});
