import browser from 'webextension-polyfill';
import { openUpdateTabAndReload } from './open-update-tab-and-reload';

jest.mock('webextension-polyfill', () => ({
  tabs: {
    create: jest.fn(),
  },
}));

describe('openUpdateTabAndReload', () => {
  const mockRequestSafeReload = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should open the update tab and then call requestSafeReload', async () => {
    await openUpdateTabAndReload(mockRequestSafeReload);

    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'https://metamask.io/updating',
      active: true,
    });
    expect(mockRequestSafeReload).toHaveBeenCalled();
  });

  it('should still call requestSafeReload even if opening the tab fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    (browser.tabs.create as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Tab creation failed');
    });

    await openUpdateTabAndReload(mockRequestSafeReload);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Tab creation failed'),
      }),
    );
    expect(mockRequestSafeReload).toHaveBeenCalled();
  });
});
