import {
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import ethereumAccounts from './eth-accounts';

const baseRequest = {
  jsonrpc: '2.0' as const,
  id: 0,
  method: 'eth_accounts',
  origin: 'http://test.com',
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getAccounts = jest.fn().mockReturnValue(['0xdead', '0xbeef']);
  const response: PendingJsonRpcResponse<string[]> = {
    jsonrpc: '2.0' as const,
    id: 0,
  };
  const handler = (request: JsonRpcRequest<JsonRpcParams>) =>
    ethereumAccounts.implementation(request, response, next, end, {
      getAccounts,
    });

  return {
    response,
    next,
    end,
    getAccounts,
    handler,
  };
};

describe('ethAccountsHandler', () => {
  it('gets sorted eth accounts from the CAIP-25 permission via the getAccounts hook', async () => {
    const { handler, getAccounts } = createMockedHandler();

    await handler(baseRequest);
    expect(getAccounts).toHaveBeenCalled();
  });

  it('returns the accounts', async () => {
    const { handler, response } = createMockedHandler();

    await handler(baseRequest);
    expect(response.result).toStrictEqual(['0xdead', '0xbeef']);
  });
});
