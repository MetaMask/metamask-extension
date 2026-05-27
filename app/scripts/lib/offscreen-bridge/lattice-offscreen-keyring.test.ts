import { OffscreenCommunicationTarget } from '../../../../shared/constants/offscreen-communication';
import { EXPECTED_SESSION_KEY } from '../gridplus-connect';
import { LatticeKeyringOffscreen } from './lattice-offscreen-keyring';

type RuntimeMock = {
  getURL: jest.Mock<string, [string]>;
  sendMessage: jest.Mock;
  lastError?: chrome.runtime.LastError;
};

describe('LatticeKeyringOffscreen', () => {
  const originalGridPlusConnectPageUrl = process.env.GRIDPLUS_CONNECT_PAGE_URL;
  const originalGridPlusConnectApiUrl = process.env.GRIDPLUS_CONNECT_API_URL;
  let runtimeMock: RuntimeMock;

  beforeEach(() => {
    jest
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-4000-8000-000000000001');

    runtimeMock = {
      getURL: jest.fn((_path: string) => 'chrome-extension://extension-id/'),
      sendMessage: jest.fn(),
      lastError: undefined,
    };

    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: runtimeMock,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, 'chrome');

    if (originalGridPlusConnectPageUrl === undefined) {
      delete process.env.GRIDPLUS_CONNECT_PAGE_URL;
    } else {
      process.env.GRIDPLUS_CONNECT_PAGE_URL = originalGridPlusConnectPageUrl;
    }

    if (originalGridPlusConnectApiUrl === undefined) {
      delete process.env.GRIDPLUS_CONNECT_API_URL;
    } else {
      process.env.GRIDPLUS_CONNECT_API_URL = originalGridPlusConnectApiUrl;
    }
  });

  it('normalizes the connect URL before sending it to the offscreen document', async () => {
    runtimeMock.sendMessage.mockImplementation((_message, callback) => {
      callback({
        result: {
          deviceId: 'device-1',
          sessionKey: EXPECTED_SESSION_KEY,
          deviceType: 'lattice',
        },
      });
    });

    const keyring = new LatticeKeyringOffscreen();

    await expect(keyring.unlock()).resolves.toBe('Unlocked');

    expect(runtimeMock.sendMessage).toHaveBeenCalledWith(
      {
        target: OffscreenCommunicationTarget.latticeOffscreen,
        params: {
          url: expect.any(String),
        },
      },
      expect.any(Function),
    );

    const [message] = runtimeMock.sendMessage.mock.calls[0];
    const url = new URL(message.params.url);

    expect(url.origin).toBe('https://app.gridplus.io');
    expect(url.pathname).toBe('/connect');
    expect(url.searchParams.get('client')).toBe(EXPECTED_SESSION_KEY);
    expect(url.searchParams.get('requestId')).toBe(
      '00000000-0000-4000-8000-000000000001',
    );
    expect(url.searchParams.get('v')).toBe('1');
    expect(url.searchParams.get('targetOrigin')).toBe(
      'chrome-extension://extension-id',
    );
    expect(url.searchParams.get('forceLogin')).toBe('true');
    expect(url.searchParams.get('return')).toBe('close');
    await expect(keyring.serialize()).resolves.toMatchObject({
      deviceId: 'device-1',
      sessionKey: EXPECTED_SESSION_KEY,
      deviceType: 'lattice',
    });
  });

  it('uses a configured GridPlus Connect page URL', async () => {
    process.env.GRIDPLUS_CONNECT_PAGE_URL = 'http://localhost:3001/connect';
    runtimeMock.sendMessage.mockImplementation((_message, callback) => {
      callback({
        result: {
          deviceId: 'device-1',
          sessionKey: EXPECTED_SESSION_KEY,
          deviceType: 'lattice',
        },
      });
    });

    await expect(new LatticeKeyringOffscreen().unlock()).resolves.toBe(
      'Unlocked',
    );

    const [message] = runtimeMock.sendMessage.mock.calls[0];
    const url = new URL(message.params.url);

    expect(url.origin).toBe('http://localhost:3001');
    expect(url.pathname).toBe('/connect');
  });

  it('rejects when Chrome reports a runtime error', async () => {
    runtimeMock.sendMessage.mockImplementation((_message, callback) => {
      runtimeMock.lastError = {
        message: 'Offscreen document unavailable.',
      };
      callback(undefined);
    });

    await expect(new LatticeKeyringOffscreen().unlock()).rejects.toThrow(
      'Offscreen document unavailable.',
    );
  });

  it('rejects an invalid offscreen response', async () => {
    runtimeMock.sendMessage.mockImplementation((_message, callback) => {
      callback({
        result: {
          deviceId: 'device-1',
        },
      });
    });

    await expect(new LatticeKeyringOffscreen().unlock()).rejects.toThrow(
      'Invalid credentials returned from Connect.',
    );
  });
});
