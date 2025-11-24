import { JsonRpcResponseStruct } from '@metamask/utils';

import { flushPromises } from '../../../../test/lib/timer-helpers';
import { mockBridgeQuotes } from '../../../../test/data/confirmations/contract-interaction';
import {
  createDappSwapMiddleware,
  DappSwapMiddlewareRequest,
} from './dapp-swap-middleware';

const REQUEST_MOCK = {
  params: [],
  id: '',
  jsonrpc: '2.0' as const,
  origin: 'test.com',
  networkClientId: 'networkClientId',
};

const fetchQuotes = jest.fn();
const setSwapQuotes = jest.fn();

const createMiddleware = () => {
  const middlewareFunction = createDappSwapMiddleware({
    fetchQuotes,
    setSwapQuotes,
    dappSwapMetricsFlag: {
      enabled: true,
      bridge_quote_fees: 250,
    },
  });
  return { middlewareFunction };
};

describe('DappSwapMiddleware', () => {
  it('gets the network configuration for the request networkClientId', async () => {
    const { middlewareFunction } = createMiddleware();

    const req = {
      ...REQUEST_MOCK,
      method: 'eth_sendTransaction',
    };

    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct.TYPE },
      () => undefined,
    );

    await flushPromises();
  });

  it('for correct origin, fetches quotes and sets swap quotes', async () => {
    fetchQuotes.mockReturnValueOnce(mockBridgeQuotes);
    const { middlewareFunction } = createMiddleware();

    const req = {
      ...REQUEST_MOCK,
      method: 'eth_sendTransaction',
      origin: 'https://metamask.github.io',
      securityAlertResponse: {
        securityAlertId: '123',
      },
      params: [
        {
          data: '0x123123123',
          from: '0x12312312312312',
          chainId: '1',
          calls: [],
        },
      ],
      networkClientId: 'networkClientId',
    };

    await middlewareFunction(
      req as unknown as DappSwapMiddlewareRequest<(string | { to: string })[]>,
      { ...JsonRpcResponseStruct.TYPE },
      () => undefined,
    );

    await flushPromises();

    expect(fetchQuotes).toHaveBeenCalledWith({
      walletAddress: '0x12312312312312',
      fee: 250,
    });
  });
});
