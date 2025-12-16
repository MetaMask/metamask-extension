import type { PendingJsonRpcResponse } from '@metamask/utils';
import type { SendCallsResult } from '@metamask/eip-5792-middleware';
import { walletSendCalls as externalWalletSendCalls } from '@metamask/eip-5792-middleware';
import { walletSendCalls, type WalletSendCallsHooks } from './wallet-sendCalls';

jest.mock('@metamask/eip-5792-middleware', () => ({
  walletSendCalls: jest.fn().mockImplementation((_req, res) => {
    res.result = {
      id: '0x123abc',
    };
    return Promise.resolve();
  }),
  processSendCalls: jest.fn(),
}));

const mockExternalHandler = jest.mocked(externalWalletSendCalls);

const baseRequest = {
  jsonrpc: '2.0' as const,
  id: 1,
  method: 'wallet_sendCalls',
  origin: 'http://test.com',
  params: [
    {
      version: '2.0.0',
      chainId: '0x1',
      from: '0xdead',
      calls: [
        {
          to: '0xbeef',
          value: '0x0',
          data: '0x',
        },
      ],
    },
  ],
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getAccounts = jest.fn().mockReturnValue(['0xdead', '0xbeef']);
  const processSendCallsHooks = {
    addTransaction: jest.fn(),
    addTransactionBatch: jest.fn(),
    getDismissSmartAccountSuggestionEnabled: jest.fn().mockReturnValue(false),
    isAtomicBatchSupported: jest.fn().mockResolvedValue({ supported: true }),
    validateSecurity: jest.fn(),
    isAuxiliaryFundsSupported: jest.fn().mockReturnValue(false),
  };
  const eip5792Messenger = {} as WalletSendCallsHooks['eip5792Messenger'];
  const response: PendingJsonRpcResponse<SendCallsResult> = {
    jsonrpc: '2.0' as const,
    id: 1,
  };

  const handler = (
    request: Parameters<typeof walletSendCalls.implementation>[0],
  ) =>
    walletSendCalls.implementation(request, response, next, end, {
      getAccounts,
      processSendCallsHooks,
      eip5792Messenger,
    });

  return {
    response,
    next,
    end,
    getAccounts,
    processSendCallsHooks,
    eip5792Messenger,
    handler,
  };
};

describe('wallet_sendCalls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has the expected method name', () => {
    expect(walletSendCalls.methodNames).toStrictEqual(['wallet_sendCalls']);
  });

  it('calls the external wallet_sendCalls handler', async () => {
    const { handler } = createMockedHandler();

    await handler(baseRequest);

    expect(mockExternalHandler).toHaveBeenCalledTimes(1);
  });

  it('calls end callback after processing', async () => {
    const { handler, end } = createMockedHandler();

    await handler(baseRequest);

    expect(end).toHaveBeenCalledTimes(1);
  });

  it('returns the batch call ID in the response', async () => {
    const { handler, response } = createMockedHandler();

    await handler(baseRequest);

    expect(response.result).toStrictEqual({
      id: '0x123abc',
    });
  });
});
