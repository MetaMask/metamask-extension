import browser from 'webextension-polyfill';
import { SECOND } from '../../../shared/constants/time';
import { segment } from './segment';
import { openUpdateTabAndReload } from './open-update-tab-and-reload';

jest.mock('webextension-polyfill', () => ({
  tabs: {
    create: jest.fn(),
  },
}));

jest.mock('./segment', () => ({
  segment: {
    flush: jest.fn(),
  },
}));

describe('openUpdateTabAndReload', () => {
  const mockRequestSafeReload = jest.fn();
  const mockFlush = segment.flush as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockFlush.mockResolvedValue(undefined);
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

  it('flushes queued analytics before requesting the reload', async () => {
    const order: string[] = [];
    mockFlush.mockImplementation(async () => {
      order.push('flush');
    });
    mockRequestSafeReload.mockImplementation(async () => {
      order.push('reload');
    });

    await openUpdateTabAndReload(mockRequestSafeReload);

    expect(order).toStrictEqual(['flush', 'reload']);
  });

  it('still reloads when flushing analytics fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockFlush.mockRejectedValueOnce(new Error('flush failed'));

    await openUpdateTabAndReload(mockRequestSafeReload);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'flush failed' }),
    );
    expect(mockRequestSafeReload).toHaveBeenCalled();
  });

  it('reloads after the timeout when flushing analytics never settles', async () => {
    jest.useFakeTimers();
    try {
      mockFlush.mockReturnValue(new Promise(() => undefined));

      const update = openUpdateTabAndReload(mockRequestSafeReload);
      await jest.advanceTimersByTimeAsync(2 * SECOND - 1);
      expect(mockRequestSafeReload).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1);
      await update;

      expect(mockRequestSafeReload).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
