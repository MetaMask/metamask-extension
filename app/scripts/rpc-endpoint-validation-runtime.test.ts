import { requestRpcChainId } from './lib/rpc-endpoint-validation-request';

jest.mock('./lib/rpc-endpoint-validation-request');

describe('RPC endpoint validation broker', () => {
  const originalConnect = chrome.runtime.connect;
  afterEach(() => {
    chrome.runtime.connect = originalConnect;
  });

  it('ignores service-worker liveness messages before accepting one URL', async () => {
    const listeners = new Set<(message: unknown) => void>();
    const port = {
      onMessage: {
        addListener: jest.fn((listener) => listeners.add(listener)),
        removeListener: jest.fn((listener) => listeners.delete(listener)),
      },
      postMessage: jest.fn(),
    };
    chrome.runtime.connect = jest.fn().mockReturnValue(port);
    jest.mocked(requestRpcChainId).mockResolvedValue({ chainId: '0x1' });

    jest.isolateModules(() => {
      jest.doMock('./lib/rpc-endpoint-validation-request', () => ({
        requestRpcChainId,
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./rpc-endpoint-validation-runtime');
    });
    for (const message of [
      null,
      { name: 'app-init-liveness', data: { method: 'app-init-liveness' } },
      { url: 7 },
    ]) {
      for (const listener of listeners) {
        listener(message);
      }
    }
    expect(requestRpcChainId).not.toHaveBeenCalled();
    expect(listeners.size).toBe(1);

    for (const listener of listeners) {
      listener({ url: 'https://rpc.example' });
    }
    await Promise.resolve();

    expect(requestRpcChainId).toHaveBeenCalledWith('https://rpc.example');
    expect(listeners.size).toBe(0);
    expect(port.postMessage).toHaveBeenCalledWith({ chainId: '0x1' });
  });
});
