import type { KeyringOptions, OpenConnectCallback } from '@gridplus/keyring';
import browser from 'webextension-polyfill';
import type { Tabs } from 'webextension-polyfill';
import {
  EXPECTED_SESSION_KEY,
  RESULT_MESSAGE_TYPE,
  RESULT_MESSAGE_VERSION,
} from './gridplus-connect';
import { GridPlusKeyringMV2 } from './gridplus-keyring-mv2';

jest.mock('webextension-polyfill', () => ({
  tabs: {
    create: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
  },
}));

type OpenedTab = Window & {
  closed: boolean;
  close: jest.Mock;
};

type WindowMessageListener = (event: MessageEvent) => void;

const REQUEST_ID = '00000000-0000-4000-8000-000000000001';
const ACCOUNT_ADDRESS = '0x1111111111111111111111111111111111111111';
const STANDARD_HD_PATH = `m/44'/60'/0'/0/x`;

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

const createFetchResponse = (
  status: number,
  body: Record<string, unknown>,
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as Response;

const mockBrowserTab: Tabs.Tab = {
  id: 42,
  index: 0,
  highlighted: false,
  active: true,
  pinned: false,
  incognito: false,
};

describe('GridPlusKeyringMV2', () => {
  let openedTab: OpenedTab;
  let capturedWindowMessageListener: WindowMessageListener | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(REQUEST_ID);

    openedTab = {
      closed: false,
      close: jest.fn(),
    } as unknown as OpenedTab;

    jest.mocked(browser.tabs.create).mockResolvedValue(mockBrowserTab);
    jest.mocked(browser.tabs.get).mockResolvedValue(mockBrowserTab);
    jest.mocked(browser.tabs.remove).mockResolvedValue(undefined);

    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: {
          getURL: jest.fn(() => 'chrome-extension://extension-id/'),
        },
      },
      writable: true,
      configurable: true,
    });

    jest.spyOn(window, 'open').mockReturnValue(openedTab);
    jest.spyOn(window, 'addEventListener').mockImplementation(
      (eventName: string, listener: EventListenerOrEventListenerObject) => {
        if (eventName === 'message') {
          capturedWindowMessageListener = listener as WindowMessageListener;
        }
      },
    );
    jest.spyOn(window, 'removeEventListener').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, 'chrome');
  });

  const sendWindowMessage = (data: unknown) => {
    if (!capturedWindowMessageListener) {
      throw new Error('Window message listener was not registered.');
    }

    capturedWindowMessageListener({
      data,
      origin: 'https://app.gridplus.io',
      source: openedTab,
    } as unknown as MessageEvent);
  };

  it('normalizes the connect URL and accepts a valid connect result', async () => {
    const keyring = new GridPlusKeyringMV2();
    const unlockPromise = keyring.unlock();
    await flushPromises();

    expect(window.open).toHaveBeenCalledWith(expect.any(String), '_blank');

    const [openedUrl] = jest.mocked(window.open).mock.calls[0];
    const url = new URL(openedUrl as string);

    expect(url.origin).toBe('https://app.gridplus.io');
    expect(url.pathname).toBe('/connect');
    expect(url.searchParams.get('client')).toBe(EXPECTED_SESSION_KEY);
    expect(url.searchParams.get('requestId')).toBe(REQUEST_ID);
    expect(url.searchParams.get('v')).toBe('1');
    expect(url.searchParams.get('targetOrigin')).toBe(
      'chrome-extension://extension-id',
    );
    expect(url.searchParams.get('forceLogin')).toBe('true');
    expect(url.searchParams.get('return')).toBe('close');

    sendWindowMessage(getValidConnectMessage());

    await expect(unlockPromise).resolves.toBe('Unlocked');
    expect(openedTab.close).toHaveBeenCalled();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    await expect(keyring.serialize()).resolves.toMatchObject({
      deviceId: 'device-1',
      sessionKey: EXPECTED_SESSION_KEY,
      deviceType: 'lattice',
    });
  });

  it('rejects if the opened GridPlus Connect tab closes', async () => {
    const keyring = new GridPlusKeyringMV2();
    const unlockPromise = keyring.unlock();
    await flushPromises();
    const rejection = expect(unlockPromise).rejects.toThrow(
      'GridPlus Connect closed.',
    );

    openedTab.closed = true;
    jest.advanceTimersByTime(500);
    await flushPromises();

    await rejection;
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
  });

  it('falls back to browser tabs when window.open is blocked', async () => {
    jest.mocked(window.open).mockReturnValueOnce(null);

    const keyring = new GridPlusKeyringMV2();
    const unlockPromise = keyring.unlock();

    await flushPromises();

    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: expect.any(String),
    });

    const [{ url: openedUrl }] = jest.mocked(browser.tabs.create).mock.calls[0];
    const url = new URL(openedUrl as string);

    expect(url.origin).toBe('https://app.gridplus.io');
    expect(url.searchParams.get('client')).toBe(EXPECTED_SESSION_KEY);
    expect(url.searchParams.get('targetOrigin')).toBe(
      'chrome-extension://extension-id',
    );

    jest.mocked(browser.tabs.get).mockRejectedValueOnce(new Error('closed'));
    const rejection = expect(unlockPromise).rejects.toThrow(
      'GridPlus Connect closed.',
    );

    jest.advanceTimersByTime(500);
    await flushPromises();

    await rejection;
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
  });

  it('deserializes legacy Lattice state without treating the old session as unlocked', async () => {
    const legacyState = {
      accounts: ['0xabc'],
      accountIndices: [3],
      accountOpts: [
        {
          walletUID: 'wallet-1',
          hdPath: `m/44'/60'/0'/0/x`,
        },
      ],
      creds: {
        deviceID: 'old-device-id',
        password: 'old-password',
        endpoint: null,
      },
    } as unknown as KeyringOptions['state'];

    const keyring = new GridPlusKeyringMV2({
      state: legacyState,
    });

    await expect(keyring.getAccounts()).resolves.toStrictEqual(['0xabc']);
    expect(keyring.isUnlocked()).toBe(false);
    await expect(keyring.serialize()).resolves.toMatchObject({
      deviceId: null,
      sessionKey: EXPECTED_SESSION_KEY,
      accounts: [
        {
          address: '0xabc',
          index: 3,
          hdPath: `m/44'/60'/0'/0/x`,
        },
      ],
    });
  });

  it('reopens GridPlus Connect and retries when the API session cookie is missing', async () => {
    const openConnect = jest.fn<
      ReturnType<OpenConnectCallback>,
      Parameters<OpenConnectCallback>
    >();
    openConnect.mockResolvedValue({
      deviceId: 'new-device-id',
      sessionKey: EXPECTED_SESSION_KEY,
      deviceType: 'lattice',
    });

    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        createFetchResponse(401, { message: 'Missing session cookie' }),
      )
      .mockResolvedValueOnce(
        createFetchResponse(200, { signature: '0xsignature' }),
      );

    const keyring = new GridPlusKeyringMV2({
      api: {
        baseUrl: 'http://localhost:9999',
      },
      openConnect,
      state: {
        deviceId: 'old-device-id',
        sessionKey: EXPECTED_SESSION_KEY,
        accounts: [
          {
            address: ACCOUNT_ADDRESS,
            signerPath: [0x8000002c, 0x8000003c, 0x80000000, 0, 0],
            hdPath: STANDARD_HD_PATH,
            index: 0,
          },
        ],
      },
    });

    await expect(
      keyring.signPersonalMessage(ACCOUNT_ADDRESS, '0x1234'),
    ).resolves.toBe('0xsignature');

    expect(openConnect).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:9999/api/v1/device/old-device-id/method',
      expect.objectContaining({
        credentials: 'include',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:9999/api/v1/device/new-device-id/method',
      expect.objectContaining({
        credentials: 'include',
      }),
    );
    await expect(keyring.serialize()).resolves.toMatchObject({
      deviceId: 'new-device-id',
      sessionKey: EXPECTED_SESSION_KEY,
    });
  });
});
