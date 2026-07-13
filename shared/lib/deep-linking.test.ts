import { openCustomProtocol } from './deep-linking';

describe('#openCustomProtocol', () => {
  describe('with msLaunchUri available', () => {
    const mockMsLaunchUri = jest.fn();
    let windowSpy: jest.SpyInstance;

    beforeEach(() => {
      windowSpy = jest
        .spyOn(global, 'window', 'get')
        .mockImplementation(
          () =>
            ({
              navigator: {
                msLaunchUri: mockMsLaunchUri,
              },
            }) as unknown as Window & typeof globalThis,
        );
    });

    afterEach(() => {
      windowSpy.mockRestore();
      mockMsLaunchUri.mockReset();
    });

    it('successfully open when protocol found', async () => {
      mockMsLaunchUri.mockImplementation((_protocol: string, cb: () => void) =>
        cb(),
      );

      await openCustomProtocol('TEST PROTOCOL');

      expect(mockMsLaunchUri).toHaveBeenCalledTimes(1);
    });

    it('throws when protocol not found', async () => {
      mockMsLaunchUri.mockImplementation(
        (_protocol: string, _cb: () => void, errorCb: () => void) => errorCb(),
      );

      await expect(openCustomProtocol('TEST PROTOCOL')).rejects.toThrow(
        'Failed to open custom protocol link',
      );
      expect(mockMsLaunchUri).toHaveBeenCalledTimes(1);
    });
  });

  describe('without msLaunchUri available', () => {
    it('successfully open when protocol found', async () => {
      // eslint-disable-next-line consistent-return
      const mockAddEventListener = jest
        .fn()
        .mockImplementation((event: string, cb: () => void) => {
          if (event === 'blur') {
            return cb();
          }
        });
      const clearTimeoutMock = jest.fn();

      const windowSpy = jest
        .spyOn(global, 'window', 'get')
        .mockImplementation(
          () =>
            ({
              addEventListener: mockAddEventListener,
              setTimeout: jest.fn(),
              clearTimeout: clearTimeoutMock,
            }) as unknown as Window & typeof globalThis,
        );

      await openCustomProtocol('TEST PROTOCOL');

      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
      expect(clearTimeoutMock).toHaveBeenCalledTimes(1);

      windowSpy.mockRestore();
      mockAddEventListener.mockRestore();
      clearTimeoutMock.mockReset();
    });

    it('throws when protocol not found', async () => {
      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(window, 'setTimeout');
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      const openCustomProtocolPromise = openCustomProtocol('TEST PROTOCOL');

      jest.advanceTimersByTime(500);

      await expect(openCustomProtocolPromise).rejects.toThrow(
        'Timeout opening custom protocol link',
      );

      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    });
  });
});
