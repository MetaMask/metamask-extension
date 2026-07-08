import { NetworkController } from '@metamask/network-controller';
import {
  getNetworkControllerInitializationConfiguration,
  getNetworkControllerInstanceOptions,
} from './network-controller';

jest.mock('@metamask/network-controller', () => {
  const actual = jest.requireActual('@metamask/network-controller');

  return {
    ...actual,
    NetworkController: jest.fn(),
  };
});

describe('getNetworkControllerInstanceOptions', () => {
  const originalFetch = globalThis.fetch;
  const originalBtoa = globalThis.btoa;

  afterEach(() => {
    Object.defineProperty(globalThis, 'fetch', {
      value: originalFetch,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'btoa', {
      value: originalBtoa,
      configurable: true,
      writable: true,
    });
  });

  it('provides RPC fetch and btoa functions bound to the host global', async () => {
    let fetchThis: unknown;
    let btoaThis: unknown;
    const recordFetchThis = (receiver: unknown) => {
      fetchThis = receiver;
    };
    const recordBtoaThis = (receiver: unknown) => {
      btoaThis = receiver;
    };
    const fetchMock = jest.fn(function (
      this: unknown,
      ..._args: Parameters<typeof fetch>
    ) {
      recordFetchThis(this);
      return Promise.resolve(new Response('{}'));
    });
    const btoaMock = jest.fn(function (
      this: unknown,
      ..._args: Parameters<typeof btoa>
    ) {
      recordBtoaThis(this);
      return 'encoded';
    });

    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock as unknown as typeof fetch,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'btoa', {
      value: btoaMock as unknown as typeof btoa,
      configurable: true,
      writable: true,
    });

    const options = getNetworkControllerInstanceOptions('test-infura-id');
    const rpcServiceOptions = options.getRpcServiceOptions?.(
      'http://localhost:8545',
    );

    expect(rpcServiceOptions?.fetch).toEqual(expect.any(Function));
    expect(rpcServiceOptions?.btoa).toEqual(expect.any(Function));

    await rpcServiceOptions?.fetch?.call(
      { notTheGlobalThis: true },
      'http://localhost:8545',
    );
    const encoded = rpcServiceOptions?.btoa?.call(
      { notTheGlobalThis: true },
      'test',
    );

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8545');
    expect(fetchThis).toBe(globalThis);
    expect(encoded).toBe('encoded');
    expect(btoaMock).toHaveBeenCalledWith('test');
    expect(btoaThis).toBe(globalThis);
  });
});

describe('getNetworkControllerInitializationConfiguration', () => {
  it('forwards extension network controller options to the constructor', () => {
    const configuration = getNetworkControllerInitializationConfiguration();
    const options = getNetworkControllerInstanceOptions('test-infura-id');
    const state = { selectedNetworkClientId: 'mainnet' };
    const messenger = { call: jest.fn() } as unknown as Parameters<
      typeof configuration.init
    >[0]['messenger'];

    configuration.init({
      state,
      messenger,
      options,
    });

    expect(NetworkController).toHaveBeenCalledWith({
      state,
      messenger,
      ...options,
    });
  });
});
