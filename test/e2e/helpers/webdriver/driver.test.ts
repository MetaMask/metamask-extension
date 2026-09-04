/** @jest-environment node */

import { Browser, ThenableWebDriver } from 'selenium-webdriver';

import { Driver, isAllowedBenchmarkCdpRequest } from '../../webdriver/driver';

describe('webdriver Driver CDP helpers', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses selenium sendDevToolsCommand when no return value is requested', async () => {
    const sendDevToolsCommand = jest.fn().mockResolvedValue(undefined);
    const driver = new Driver({
      browser: Browser.CHROME,
      driver: { sendDevToolsCommand } as unknown as ThenableWebDriver,
      extensionUrl: 'chrome-extension://test',
      disableServerMochaToBackground: true,
    });

    await driver.executeCdpCommand('Network.enable', { maxTotalBufferSize: 1 });

    expect(sendDevToolsCommand).toHaveBeenCalledWith('Network.enable', {
      maxTotalBufferSize: 1,
    });
  });

  it('uses selenium sendAndGetDevToolsCommand when a result is requested', async () => {
    const sendAndGetDevToolsCommand = jest
      .fn()
      .mockResolvedValue({ data: 'ok' });
    const driver = new Driver({
      browser: Browser.CHROME,
      driver: { sendAndGetDevToolsCommand } as unknown as ThenableWebDriver,
      extensionUrl: 'chrome-extension://test',
      disableServerMochaToBackground: true,
    });

    await expect(
      driver.executeCdpCommand(
        'Network.getResponseBody',
        { requestId: '1' },
        {
          returnValue: true,
        },
      ),
    ).resolves.toStrictEqual({ data: 'ok' });
  });

  it('detects unexpected benchmark requests via Network.requestWillBeSent', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    let messageHandler: ((message: string) => void) | undefined;
    const seleniumDriver = {
      createCDPConnection: jest.fn().mockResolvedValue({ execute }),
    } as Record<string, unknown>;
    seleniumDriver._cdpWsConnection = {
      on: jest.fn((event: string, handler: (message: string) => void) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      }),
    };
    const driver = new Driver({
      browser: Browser.CHROME,
      driver: seleniumDriver as unknown as ThenableWebDriver,
      extensionUrl: 'chrome-extension://test',
      disableServerMochaToBackground: true,
    });

    await driver.enableBenchmarkCdpNetworkGuard();

    expect(execute).toHaveBeenCalledWith('Network.enable', {}, null);
    expect(execute).toHaveBeenCalledWith(
      'Network.setCacheDisabled',
      { cacheDisabled: true },
      null,
    );

    messageHandler?.(
      JSON.stringify({
        method: 'Network.requestWillBeSent',
        params: {
          requestId: 'allowed-request',
          request: {
            url: 'https://price.api.cx.metamask.io/v3/spot-prices/ethereum',
          },
        },
      }),
    );
    await new Promise(setImmediate);

    expect(driver.errors).toHaveLength(0);

    messageHandler?.(
      JSON.stringify({
        method: 'Network.requestWillBeSent',
        params: {
          requestId: 'unexpected-request',
          request: {
            url: 'https://unexpected.example.com/request',
          },
        },
      }),
    );
    await new Promise(setImmediate);

    expect(driver.errors).toEqual([
      expect.stringContaining('https://unexpected.example.com/request'),
    ]);
  });

  it('matches benchmark allowlist wildcard patterns', () => {
    expect(
      isAllowedBenchmarkCdpRequest(
        'https://tx-sentinel-staging.api.cx.metamask.io/v1/networks',
      ),
    ).toBe(true);
    expect(
      isAllowedBenchmarkCdpRequest('https://unexpected.example.com/request'),
    ).toBe(false);
  });
});
