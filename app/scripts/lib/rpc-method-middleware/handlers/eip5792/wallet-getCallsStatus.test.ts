import type { PendingJsonRpcResponse } from '@metamask/utils';
import type { GetCallsStatusResult } from '@metamask/eip-5792-middleware';
import { walletGetCallsStatus as externalWalletGetCallsStatus } from '@metamask/eip-5792-middleware';
import {
  walletGetCallsStatus,
  type WalletGetCallsStatusHooks,
} from './wallet-getCallsStatus';

jest.mock('@metamask/eip-5792-middleware', () => ({
  walletGetCallsStatus: jest.fn().mockImplementation((_req, res) => {
    res.result = {
      status: 'CONFIRMED',
      receipts: [
        {
          logs: [],
          status: '0x1',
          blockHash: '0xabc',
          blockNumber: '0x1',
          gasUsed: '0x5208',
          transactionHash: '0xdef',
        },
      ],
    };
    return Promise.resolve();
  }),
  getCallsStatus: jest.fn(),
}));

const mockExternalHandler = jest.mocked(externalWalletGetCallsStatus);

const baseRequest = {
  jsonrpc: '2.0' as const,
  id: 1,
  method: 'wallet_getCallsStatus',
  origin: 'http://test.com',
  params: ['0x123abc'],
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const eip5792Messenger = {} as WalletGetCallsStatusHooks['eip5792Messenger'];
  const response: PendingJsonRpcResponse<GetCallsStatusResult> = {
    jsonrpc: '2.0' as const,
    id: 1,
  };

  const handler = (
    request: Parameters<typeof walletGetCallsStatus.implementation>[0],
  ) =>
    walletGetCallsStatus.implementation(request, response, next, end, {
      eip5792Messenger,
    });

  return {
    response,
    next,
    end,
    eip5792Messenger,
    handler,
  };
};

describe('wallet_getCallsStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has the expected method name', () => {
    expect(walletGetCallsStatus.methodNames).toStrictEqual([
      'wallet_getCallsStatus',
    ]);
  });

  it('calls the external wallet_getCallsStatus handler', async () => {
    const { handler } = createMockedHandler();

    await handler(baseRequest);

    expect(mockExternalHandler).toHaveBeenCalledTimes(1);
  });

  it('calls end callback after processing', async () => {
    const { handler, end } = createMockedHandler();

    await handler(baseRequest);

    expect(end).toHaveBeenCalledTimes(1);
  });

  it('returns the call status in the response', async () => {
    const { handler, response } = createMockedHandler();

    await handler(baseRequest);

    expect(response.result).toStrictEqual({
      status: 'CONFIRMED',
      receipts: [
        {
          logs: [],
          status: '0x1',
          blockHash: '0xabc',
          blockNumber: '0x1',
          gasUsed: '0x5208',
          transactionHash: '0xdef',
        },
      ],
    });
  });
});
