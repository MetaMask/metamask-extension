import type { PendingJsonRpcResponse } from '@metamask/utils';
import type { GetCapabilitiesResult } from '@metamask/eip-5792-middleware';
import { walletGetCapabilities as externalWalletGetCapabilities } from '@metamask/eip-5792-middleware';
import {
  walletGetCapabilities,
  type WalletGetCapabilitiesHooks,
} from './wallet-getCapabilities';

jest.mock('@metamask/eip-5792-middleware', () => ({
  walletGetCapabilities: jest.fn().mockImplementation((_req, res) => {
    res.result = {
      '0x1': {
        atomicBatch: { supported: true },
      },
    };
    return Promise.resolve();
  }),
  getCapabilities: jest.fn(),
}));

const mockExternalHandler = jest.mocked(externalWalletGetCapabilities);

const baseRequest = {
  jsonrpc: '2.0' as const,
  id: 1,
  method: 'wallet_getCapabilities',
  origin: 'http://test.com',
  params: ['0xdeadbeef'],
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getAccounts = jest.fn().mockReturnValue(['0xdead', '0xbeef']);
  const getCapabilitiesHooks = {
    getDismissSmartAccountSuggestionEnabled: jest.fn().mockReturnValue(false),
    getIsSmartTransaction: jest.fn().mockReturnValue(false),
    isAtomicBatchSupported: jest.fn().mockResolvedValue({ supported: true }),
    isRelaySupported: jest.fn().mockReturnValue(false),
    getSendBundleSupportedChains: jest.fn().mockReturnValue([]),
    isAuxiliaryFundsSupported: jest.fn().mockReturnValue(false),
  };
  const eip5792Messenger = {} as WalletGetCapabilitiesHooks['eip5792Messenger'];
  const response: PendingJsonRpcResponse<GetCapabilitiesResult> = {
    jsonrpc: '2.0' as const,
    id: 1,
  };

  const handler = (
    request: Parameters<typeof walletGetCapabilities.implementation>[0],
  ) =>
    walletGetCapabilities.implementation(request, response, next, end, {
      getAccounts,
      getCapabilitiesHooks,
      eip5792Messenger,
    });

  return {
    response,
    next,
    end,
    getAccounts,
    getCapabilitiesHooks,
    eip5792Messenger,
    handler,
  };
};

describe('wallet_getCapabilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has the expected method name', () => {
    expect(walletGetCapabilities.methodNames).toStrictEqual([
      'wallet_getCapabilities',
    ]);
  });

  it('calls the external wallet_getCapabilities handler', async () => {
    const { handler } = createMockedHandler();

    await handler(baseRequest);

    expect(mockExternalHandler).toHaveBeenCalledTimes(1);
  });

  it('calls end callback after processing', async () => {
    const { handler, end } = createMockedHandler();

    await handler(baseRequest);

    expect(end).toHaveBeenCalledTimes(1);
  });

  it('returns capabilities in the response', async () => {
    const { handler, response } = createMockedHandler();

    await handler(baseRequest);

    expect(response.result).toStrictEqual({
      '0x1': {
        atomicBatch: { supported: true },
      },
    });
  });
});
