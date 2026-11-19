/** @jest-environment node */

import { it } from '@jest/globals';
import { BRAZE_TARGET } from '../braze/protocol';
import { sendBrazeSession } from './braze-request';
import { installBrazeTransport } from './braze';

jest.mock('./braze-request');

type Listener<Args extends unknown[]> = (...args: Args) => void;

function mockEvent<Args extends unknown[]>() {
  const addListener = jest.fn<void, [Listener<Args>]>();
  return {
    addListener,
    emit: (...args: Args) => {
      for (const [listener] of addListener.mock.calls) {
        listener(...args);
      }
    },
  };
}

describe('installBrazeTransport', () => {
  const profile = 'canonical-profile';
  const extensionId = 'test-extension';
  const getURL = (path: string) => `chrome-extension://${extensionId}/${path}`;
  const onConnect = mockEvent<[unknown]>();
  const sender = { id: extensionId, url: getURL('service-worker.js') };
  const newWorker = jest.fn((_url: string) => ({
    postMessage: jest.fn(),
    terminate: jest.fn(),
    onmessage: jest.fn<Promise<void>, [{ data: unknown }]>(),
  }));
  const sendSession = jest.mocked(sendBrazeSession);
  const request = {
    id: 1,
    method: 'POST',
    url: 'https://sdk.synthetic.braze.com/api/v3/data/',
    body: '{}',
  };

  function openPort(source: chrome.runtime.MessageSender = sender) {
    const port = {
      name: BRAZE_TARGET,
      sender: source,
      onMessage: mockEvent<[unknown]>(),
      onDisconnect: mockEvent<[]>(),
      disconnect: jest.fn(),
    };
    onConnect.emit(port);
    return port;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(process, 'env', {
      ...process.env,
      IN_TEST: '',
      ENABLE_LAVAMOAT: 'true',
      BRAZE_WEB_API_KEY: 'public-test-key',
      BRAZE_SDK_ENDPOINT: 'sdk.synthetic.braze.com',
    });
    Object.defineProperties(globalThis, {
      chrome: {
        configurable: true,
        value: { runtime: { id: extensionId, getURL, onConnect } },
      },
      location: {
        configurable: true,
        value: { href: getURL('offscreen.html') },
      },
      Worker: { configurable: true, value: newWorker },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, 'chrome');
    Reflect.deleteProperty(globalThis, 'location');
    Reflect.deleteProperty(globalThis, 'Worker');
  });

  it.each([
    ['BRAZE_SDK_ENDPOINT', ''],
    ['BRAZE_WEB_API_KEY', ''],
    ['IN_TEST', 'true'],
  ])('does not register a listener when %s is %j', (name, value) => {
    process.env[name] = value;
    installBrazeTransport();
    expect(onConnect.addListener).not.toHaveBeenCalled();
  });

  it('starts the worker without LavaMoat', () => {
    process.env.ENABLE_LAVAMOAT = 'false';
    installBrazeTransport();
    openPort().onMessage.emit(profile);
    expect(newWorker).toHaveBeenCalledWith(getURL('workers/braze.js'));
  });

  it('ignores ports from a document or another extension', () => {
    installBrazeTransport();
    for (const source of [
      { ...sender, url: getURL('home.html') },
      { ...sender, documentId: 'an-extension-document' },
      { ...sender, tab: {} as chrome.tabs.Tab },
      { ...sender, id: 'other-extension' },
    ]) {
      openPort(source).onMessage.emit(profile);
    }
    expect(newWorker).not.toHaveBeenCalled();
  });

  it.each(['disconnect', 'replacement'])(
    'revokes the active worker and request on %s',
    async (restriction) => {
      installBrazeTransport();
      let finishRequest!: (status: number) => void;
      sendSession.mockReturnValueOnce(
        new Promise((resolve) => {
          finishRequest = resolve;
        }),
      );
      const port = openPort();
      port.onMessage.emit('');
      expect(newWorker).not.toHaveBeenCalled();
      port.onMessage.emit(profile);
      port.onMessage.emit('another-profile');
      expect(newWorker).toHaveBeenCalledTimes(1);
      const worker = newWorker.mock.results[0].value;
      const pending = worker.onmessage({ data: request });
      const [, { signal, profile: sentProfile }] = sendSession.mock.calls[0];
      expect(sentProfile).toBe(profile);
      expect(signal.aborted).toBe(false);

      if (restriction === 'disconnect') {
        port.onDisconnect.emit();
        expect(signal.aborted).toBe(true);
      }
      const currentPort = openPort();
      expect(signal.aborted).toBe(true);
      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(port.disconnect).toHaveBeenCalledTimes(
        restriction === 'replacement' ? 1 : 0,
      );

      port.onMessage.emit('stale-profile');
      currentPort.onMessage.emit(profile);
      port.onDisconnect.emit();
      expect(newWorker).toHaveBeenCalledTimes(2);
      expect(newWorker).toHaveBeenLastCalledWith(getURL('workers/braze.js'));
      expect(newWorker.mock.results[1].value.terminate).not.toHaveBeenCalled();

      finishRequest(200);
      await pending;
      await worker.onmessage({ data: request });
      expect(sendSession).toHaveBeenCalledTimes(1);
      expect(worker.postMessage).toHaveBeenCalledTimes(1);
    },
  );

  it('revokes the connection on a worker startup failure', async () => {
    installBrazeTransport();
    const port = openPort();
    port.onMessage.emit(profile);
    const worker = newWorker.mock.results[0].value;

    await worker.onmessage({ data: { type: 'failed' } });
    port.onMessage.emit(profile);

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(port.disconnect).toHaveBeenCalledTimes(1);
    expect(newWorker).toHaveBeenCalledTimes(1);
    openPort().onMessage.emit(profile);
    expect(newWorker).toHaveBeenCalledTimes(2);
  });
});
