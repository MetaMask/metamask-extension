import browser from 'webextension-polyfill';

import { requestSafeReload } from '../../store/actions';
import { reloadExtensionFromUi } from './reload-extension-from-ui';

jest.mock('webextension-polyfill', () => ({
  runtime: { reload: jest.fn() },
}));

jest.mock('../../store/actions', () => ({
  requestSafeReload: jest.fn(),
}));

describe('reloadExtensionFromUi', () => {
  const requestSafeReloadMock = requestSafeReload as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    window.close = jest.fn();
  });

  it('requests safe reload then closes the window', async () => {
    requestSafeReloadMock.mockResolvedValue(undefined);

    await reloadExtensionFromUi();

    expect(requestSafeReloadMock).toHaveBeenCalledTimes(1);
    expect(window.close).toHaveBeenCalledTimes(1);
    expect(browser.runtime.reload).not.toHaveBeenCalled();
  });

  it('falls back to runtime.reload when the background request fails', async () => {
    requestSafeReloadMock.mockRejectedValue(new Error('disconnected'));

    await reloadExtensionFromUi();

    expect(requestSafeReloadMock).toHaveBeenCalledTimes(1);
    expect(browser.runtime.reload).toHaveBeenCalledTimes(1);
    expect(window.close).not.toHaveBeenCalled();
  });
});
