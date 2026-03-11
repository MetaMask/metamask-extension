import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
} from '../../shared/constants/offscreen-communication';

const mockOn = jest.fn();
const mockInit = jest.fn();
const mockDispose = jest.fn();
const mockGetPublicKey = jest.fn();
const mockSignTransaction = jest.fn();
const mockSignMessage = jest.fn();
const mockSignTypedData = jest.fn();
const mockGetFeatures = jest.fn();

jest.mock('@trezor/connect-web', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  DEVICE: {
    CONNECT: 'device-connect',
  },
  DEVICE_EVENT: 'device-event',
  default: {
    on: (...args: unknown[]) => mockOn(...args),
    init: (...args: unknown[]) => mockInit(...args),
    dispose: (...args: unknown[]) => mockDispose(...args),
    getPublicKey: (...args: unknown[]) => mockGetPublicKey(...args),
    ethereumSignTransaction: (...args: unknown[]) =>
      mockSignTransaction(...args),
    ethereumSignMessage: (...args: unknown[]) => mockSignMessage(...args),
    ethereumSignTypedData: (...args: unknown[]) => mockSignTypedData(...args),
    getFeatures: (...args: unknown[]) => mockGetFeatures(...args),
  },
}));

type TrezorMessage = {
  target: string;
  action: TrezorAction;
  params?: Record<string, unknown>;
};

type Deferred<TResult> = {
  promise: Promise<TResult>;
  resolve: (value: TResult) => void;
  reject: (error: unknown) => void;
};

function createDeferred<TResult>(): Deferred<TResult> {
  let resolve!: (value: TResult) => void;
  let reject!: (error: unknown) => void;

  const promise = new Promise<TResult>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

describe('Trezor offscreen', () => {
  let mockSendMessage: jest.Mock;
  let mockAddListener: jest.Mock;
  let capturedDeviceListener: ((event: unknown) => void) | undefined;
  let capturedMessageListener: (
    msg: TrezorMessage,
    sender: unknown,
    sendResponse: (response?: unknown) => void,
  ) => boolean | void;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    mockSendMessage = jest.fn();
    mockAddListener = jest.fn((callback) => {
      capturedMessageListener = callback;
    });
    mockOn.mockImplementation((_eventName, callback) => {
      capturedDeviceListener = callback;
    });
    mockInit.mockResolvedValue(undefined);
    mockDispose.mockReturnValue(undefined);
    mockGetPublicKey.mockResolvedValue({
      success: true,
      payload: {
        publicKey: 'public-key',
        chainCode: 'chain-code',
      },
    });
    mockSignTransaction.mockResolvedValue({
      success: true,
      payload: { v: '1b', r: 'aa', s: 'bb' },
    });
    mockSignMessage.mockResolvedValue({
      success: true,
      payload: { signature: 'signature' },
    });
    mockSignTypedData.mockResolvedValue({
      success: true,
      payload: { signature: 'typed-signature' },
    });
    mockGetFeatures.mockResolvedValue({
      success: true,
      payload: { model: 'T' },
    });

    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: {
          sendMessage: mockSendMessage,
          onMessage: {
            addListener: mockAddListener,
          },
        },
      },
      writable: true,
      configurable: true,
    });

    const module = await import('./trezor');
    module.default();
  });

  const sendAction = (
    action: TrezorAction,
    params?: Record<string, unknown>,
  ): Promise<unknown> => {
    return new Promise((resolve) => {
      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action,
          params,
        },
        {},
        resolve,
      );
    });
  };

  describe('init', () => {
    it('registers the runtime message listener', () => {
      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('registers the device listener once across repeated init calls', async () => {
      await sendAction(TrezorAction.init, { manifest: { email: 'test' } });
      await sendAction(TrezorAction.init, { manifest: { email: 'test' } });

      expect(mockOn).toHaveBeenCalledTimes(1);
      expect(mockInit).toHaveBeenCalledTimes(1);
    });

    it('forwards device connect events to the extension', async () => {
      await sendAction(TrezorAction.init, { manifest: { email: 'test' } });

      capturedDeviceListener?.({
        type: 'device-connect',
        payload: {
          features: {
            model: '2',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            minor_version: 8,
          },
        },
      });

      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.trezorDeviceConnect,
        payload: {
          model: '2',
          minorVersion: 8,
        },
      });
    });
  });

  describe('message handling', () => {
    it('ignores messages for other targets', () => {
      const sendResponse = jest.fn();

      const result = capturedMessageListener(
        {
          target: 'other-target',
          action: TrezorAction.getFeatures,
        },
        {},
        sendResponse,
      );

      expect(result).toBeUndefined();
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('returns true for async trezor messages', () => {
      const sendResponse = jest.fn();

      const result = capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.getFeatures,
        },
        {},
        sendResponse,
      );

      expect(result).toBe(true);
    });

    describe('queueing', () => {
      it('waits for init to settle before starting queued device operations', async () => {
        const initOperation = createDeferred<void>();

        mockInit.mockReturnValue(initOperation.promise);
        mockGetFeatures.mockResolvedValue({
          success: true,
          payload: { model: 'Safe 5' },
        });

        const initResponsePromise = sendAction(TrezorAction.init, {
          manifest: { email: 'test' },
        });
        const featuresResponsePromise = sendAction(TrezorAction.getFeatures);

        await Promise.resolve();

        expect(mockInit).toHaveBeenCalledTimes(1);
        expect(mockGetFeatures).not.toHaveBeenCalled();

        initOperation.resolve(undefined);

        await initResponsePromise;
        await Promise.resolve();

        expect(mockGetFeatures).toHaveBeenCalledTimes(1);

        await expect(featuresResponsePromise).resolves.toEqual({
          success: true,
          payload: { model: 'Safe 5' },
        });
      });

      it('waits for the first device operation to settle before starting the second', async () => {
        const firstOperation = createDeferred<{
          success: boolean;
          payload: { publicKey: string; chainCode: string };
        }>();
        const secondOperation = createDeferred<{
          success: boolean;
          payload: { v: string; r: string; s: string };
        }>();

        mockGetPublicKey.mockReturnValue(firstOperation.promise);
        mockSignTransaction.mockReturnValue(secondOperation.promise);

        const firstResponsePromise = sendAction(TrezorAction.getPublicKey, {
          path: "m/44'/60'/0'/0/0",
          coin: 'ETH',
        });
        const secondResponsePromise = sendAction(TrezorAction.signTransaction, {
          path: "m/44'/60'/0'/0/0",
          transaction: { nonce: '0x1' },
        });

        await Promise.resolve();

        expect(mockGetPublicKey).toHaveBeenCalledTimes(1);
        expect(mockSignTransaction).not.toHaveBeenCalled();

        firstOperation.resolve({
          success: true,
          payload: {
            publicKey: 'first-public-key',
            chainCode: 'first-chain-code',
          },
        });

        await firstResponsePromise;
        await Promise.resolve();

        expect(mockSignTransaction).toHaveBeenCalledTimes(1);

        secondOperation.resolve({
          success: true,
          payload: {
            v: '1b',
            r: 'aa',
            s: 'bb',
          },
        });

        await expect(secondResponsePromise).resolves.toEqual({
          success: true,
          payload: {
            v: '1b',
            r: 'aa',
            s: 'bb',
          },
        });
      });

      it('continues processing queued operations after a failure', async () => {
        const firstOperation = createDeferred<{
          success: boolean;
          payload: { publicKey: string; chainCode: string };
        }>();

        mockGetPublicKey.mockReturnValue(firstOperation.promise);
        mockGetFeatures.mockResolvedValue({
          success: true,
          payload: { model: 'Safe 3' },
        });

        const firstResponsePromise = sendAction(TrezorAction.getPublicKey, {
          path: "m/44'/60'/0'/0/0",
          coin: 'ETH',
        });
        const secondResponsePromise = sendAction(TrezorAction.getFeatures);

        firstOperation.reject(new Error('The device is already open.'));

        await expect(firstResponsePromise).resolves.toEqual({
          success: false,
          payload: {
            error: 'The device is already open.',
          },
        });

        await expect(secondResponsePromise).resolves.toEqual({
          success: true,
          payload: { model: 'Safe 3' },
        });
      });
    });

    it('returns structured error responses for rejected SDK calls', async () => {
      mockSignMessage.mockRejectedValue(new Error('Trezor popup closed'));

      await expect(
        sendAction(TrezorAction.signMessage, {
          path: "m/44'/60'/0'/0/0",
          message: 'abcd',
          hex: true,
        }),
      ).resolves.toEqual({
        success: false,
        payload: {
          error: 'Trezor popup closed',
        },
      });
    });

    it('returns a structured error for unsupported actions', async () => {
      await expect(sendAction('unsupported' as TrezorAction)).resolves.toEqual({
        success: false,
        payload: {
          error: 'Trezor action not supported',
        },
      });
    });

    it('waits for in-flight work before disposing and rejects later queued operations', async () => {
      const firstOperation = createDeferred<{
        success: boolean;
        payload: { publicKey: string; chainCode: string };
      }>();

      await sendAction(TrezorAction.init, { manifest: { email: 'test' } });

      mockGetPublicKey.mockReturnValue(firstOperation.promise);

      const firstResponsePromise = sendAction(TrezorAction.getPublicKey, {
        path: "m/44'/60'/0'/0/0",
        coin: 'ETH',
      });
      const disposeResponsePromise = sendAction(TrezorAction.dispose);
      const featuresResponsePromise = sendAction(TrezorAction.getFeatures);

      await Promise.resolve();

      expect(mockDispose).not.toHaveBeenCalled();
      expect(mockGetFeatures).not.toHaveBeenCalled();

      firstOperation.resolve({
        success: true,
        payload: {
          publicKey: 'first-public-key',
          chainCode: 'first-chain-code',
        },
      });

      await firstResponsePromise;
      await Promise.resolve();

      expect(mockDispose).toHaveBeenCalledTimes(1);
      expect(mockGetFeatures).not.toHaveBeenCalled();

      await expect(disposeResponsePromise).resolves.toBeUndefined();
      await expect(featuresResponsePromise).resolves.toEqual({
        success: false,
        payload: {
          error: 'Trezor Connect is not initialized',
        },
      });
    });
  });
});
