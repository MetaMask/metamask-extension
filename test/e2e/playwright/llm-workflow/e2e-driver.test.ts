import type { Page } from '@playwright/test';
import type { Driver } from '../../webdriver/driver';
import { PlaywrightDriver } from '../../webdriver/driver-playwright';
import { getE2EDriver, withTimeout } from './e2e-driver';

jest.mock('../../webdriver/driver-playwright', () => ({
  PlaywrightDriver: jest.fn().mockImplementation((options) => ({ options })),
}));

function buildPage(url: string): Page {
  const context = { kind: 'context' };
  return {
    url: () => url,
    context: () => context,
  } as unknown as Page;
}

describe('e2e-driver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getE2EDriver', () => {
    it('builds a PlaywrightDriver for the extension page', () => {
      const page = buildPage('chrome-extension://abcdef/home.html#/');

      getE2EDriver(page);

      expect(PlaywrightDriver).toHaveBeenCalledWith({
        context: page.context(),
        page,
        browser: 'chrome',
        extensionId: 'abcdef',
        extensionUrl: 'chrome-extension://abcdef',
        timeout: 30_000,
      });
    });

    it('reuses one driver per page', () => {
      const page = buildPage('chrome-extension://abcdef/home.html');

      expect(getE2EDriver(page)).toBe(getE2EDriver(page));
      expect(getE2EDriver(buildPage('about:blank'))).not.toBe(
        getE2EDriver(page),
      );
      expect(PlaywrightDriver).toHaveBeenCalledTimes(2);
    });
  });

  describe('withTimeout', () => {
    it('overrides timeout and keeps methods bound to the wrapper', () => {
      const driver = {
        timeout: 30_000,
        name: 'driver',
        currentTimeout(this: { timeout: number }) {
          return this.timeout;
        },
      };

      const wrapped = withTimeout(
        driver as unknown as Driver,
        500,
      ) as unknown as typeof driver;

      expect(wrapped.timeout).toBe(500);
      expect(wrapped.name).toBe('driver');
      expect(wrapped.currentTimeout()).toBe(500);
      expect(driver.timeout).toBe(30_000);
    });
  });
});
