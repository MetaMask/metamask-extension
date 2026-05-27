import {
  KnownOrigins,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import {
  EXPECTED_SESSION_KEY,
  RESULT_MESSAGE_TYPE,
  RESULT_MESSAGE_VERSION,
} from '../../scripts/lib/gridplus-connect';
import init from './lattice';

type RuntimeMessage = {
  target?: string;
  params?: {
    url?: string;
  };
};

type RuntimeMessageListener = (
  message: RuntimeMessage,
  sender: unknown,
  sendResponse: (response: unknown) => void,
) => boolean | undefined | void;

type WindowMessageListener = (event: MessageEvent) => void;

type OpenedTab = Window & {
  closed: boolean;
  close: jest.Mock;
};

const REQUEST_ID = 'request-1';

const getConnectUrl = () => {
  const url = new URL(`${KnownOrigins.lattice}/connect`);
  url.searchParams.set('client', EXPECTED_SESSION_KEY);
  url.searchParams.set('requestId', REQUEST_ID);
  return url.toString();
};

const getValidConnectMessage = () => ({
  type: RESULT_MESSAGE_TYPE,
  v: RESULT_MESSAGE_VERSION,
  requestId: REQUEST_ID,
  client: EXPECTED_SESSION_KEY,
  ok: true,
  sessionKey: EXPECTED_SESSION_KEY,
  deviceId: 'device-1',
  deviceType: 'lattice',
});

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('Lattice offscreen document', () => {
  let capturedRuntimeMessageListener: RuntimeMessageListener | undefined;
  let capturedWindowMessageListener: WindowMessageListener | undefined;
  let openedTab: OpenedTab;

  beforeEach(() => {
    jest.useFakeTimers();

    openedTab = {
      closed: false,
      close: jest.fn(),
    } as unknown as OpenedTab;

    jest.spyOn(window, 'open').mockReturnValue(openedTab);
    jest.spyOn(window, 'addEventListener').mockImplementation(
      (eventName: string, listener: EventListenerOrEventListenerObject) => {
        if (eventName === 'message') {
          capturedWindowMessageListener = listener as WindowMessageListener;
        }
      },
    );
    jest.spyOn(window, 'removeEventListener').mockImplementation(jest.fn());

    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: {
          onMessage: {
            addListener: jest.fn((listener: RuntimeMessageListener) => {
              capturedRuntimeMessageListener = listener;
            }),
          },
        },
      },
      writable: true,
      configurable: true,
    });

    init();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, 'chrome');
  });

  const sendRuntimeMessage = (
    message: RuntimeMessage,
    sendResponse = jest.fn(),
  ) => {
    if (!capturedRuntimeMessageListener) {
      throw new Error('Runtime message listener was not registered.');
    }

    const keepAlive = capturedRuntimeMessageListener(
      message,
      {},
      sendResponse,
    );

    return { keepAlive, sendResponse };
  };

  const sendWindowMessage = ({
    data,
    origin = KnownOrigins.lattice,
    source = openedTab,
  }: {
    data: unknown;
    origin?: string;
    source?: MessageEventSource | null;
  }) => {
    if (!capturedWindowMessageListener) {
      throw new Error('Window message listener was not registered.');
    }

    capturedWindowMessageListener({
      data,
      origin,
      source,
    } as MessageEvent);
  };

  it('sends an error when the connect URL is missing', () => {
    const { keepAlive, sendResponse } = sendRuntimeMessage({
      target: OffscreenCommunicationTarget.latticeOffscreen,
    });

    expect(keepAlive).toBeUndefined();
    expect(sendResponse).toHaveBeenCalledWith({
      error: 'Missing connect URL.',
    });
    expect(window.open).not.toHaveBeenCalled();
  });

  it('forwards a validated connect result', async () => {
    const { keepAlive, sendResponse } = sendRuntimeMessage({
      target: OffscreenCommunicationTarget.latticeOffscreen,
      params: {
        url: getConnectUrl(),
      },
    });

    expect(keepAlive).toBe(true);
    await flushPromises();

    expect(window.open).toHaveBeenCalledWith(getConnectUrl());

    sendWindowMessage({
      data: getValidConnectMessage(),
    });

    expect(openedTab.close).toHaveBeenCalled();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    expect(sendResponse).toHaveBeenCalledWith({
      result: {
        deviceId: 'device-1',
        sessionKey: EXPECTED_SESSION_KEY,
        deviceType: 'lattice',
      },
    });
  });

  it('ignores messages from the wrong origin or request', async () => {
    const { sendResponse } = sendRuntimeMessage({
      target: OffscreenCommunicationTarget.latticeOffscreen,
      params: {
        url: getConnectUrl(),
      },
    });

    await flushPromises();

    sendWindowMessage({
      data: getValidConnectMessage(),
      origin: 'https://example.com',
    });
    sendWindowMessage({
      data: {
        ...getValidConnectMessage(),
        requestId: 'other-request',
      },
      source: {} as MessageEventSource,
    });

    expect(sendResponse).not.toHaveBeenCalled();

    sendWindowMessage({
      data: getValidConnectMessage(),
    });

    expect(sendResponse).toHaveBeenCalledWith({
      result: {
        deviceId: 'device-1',
        sessionKey: EXPECTED_SESSION_KEY,
        deviceType: 'lattice',
      },
    });
  });

  it('accepts a validated connect result when the WindowProxy source differs', async () => {
    const { sendResponse } = sendRuntimeMessage({
      target: OffscreenCommunicationTarget.latticeOffscreen,
      params: {
        url: getConnectUrl(),
      },
    });

    await flushPromises();

    sendWindowMessage({
      data: getValidConnectMessage(),
      source: {} as MessageEventSource,
    });

    expect(sendResponse).toHaveBeenCalledWith({
      result: {
        deviceId: 'device-1',
        sessionKey: EXPECTED_SESSION_KEY,
        deviceType: 'lattice',
      },
    });
  });

  it('fails when the opened GridPlus Connect tab closes', async () => {
    const { sendResponse } = sendRuntimeMessage({
      target: OffscreenCommunicationTarget.latticeOffscreen,
      params: {
        url: getConnectUrl(),
      },
    });

    await flushPromises();

    openedTab.closed = true;
    jest.advanceTimersByTime(500);

    expect(sendResponse).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    expect(sendResponse).toHaveBeenCalledWith({
      error: 'GridPlus Connect closed.',
    });
  });

  it('forwards validation failures', async () => {
    const { sendResponse } = sendRuntimeMessage({
      target: OffscreenCommunicationTarget.latticeOffscreen,
      params: {
        url: getConnectUrl(),
      },
    });

    await flushPromises();

    sendWindowMessage({
      data: {
        ...getValidConnectMessage(),
        ok: false,
        reason: 'User rejected.',
      },
    });

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    expect(sendResponse).toHaveBeenCalledWith({
      error: 'User rejected.',
    });
  });
});
