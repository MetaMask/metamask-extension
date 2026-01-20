import type { ExtensionReadinessDeps } from './extension-readiness';
import { waitForExtensionUiReady } from './extension-readiness';

describe('waitForExtensionUiReady', () => {
  it('logs readiness when a selector is found', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    const page = {
      waitForSelector: jest.fn().mockResolvedValueOnce(null),
    };

    await waitForExtensionUiReady({
      page: page as unknown as ExtensionReadinessDeps['page'],
      screenshotDir: '/tmp',
      log,
    });

    expect(log.info).toHaveBeenCalledWith('Extension UI is ready');
  });

  it('captures a screenshot when readiness fails', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    const page = {
      waitForSelector: jest.fn().mockRejectedValue(new Error('timeout')),
      url: jest.fn().mockReturnValue('chrome-extension://test/home.html'),
      screenshot: jest.fn().mockResolvedValue(undefined),
    };

    await expect(
      waitForExtensionUiReady({
        page: page as unknown as ExtensionReadinessDeps['page'],
        screenshotDir: '/tmp',
        log,
      }),
    ).rejects.toThrow('Extension UI did not reach expected state');

    expect(page.screenshot).toHaveBeenCalled();
    expect(log.error).toHaveBeenCalled();
  });
});
