import type { PendingJsonRpcResponse } from '@metamask/utils';
import { walletUpgradeAccount as externalWalletUpgradeAccount } from '@metamask/eip-7702-internal-rpc-middleware';
import { walletUpgradeAccount } from './wallet-upgradeAccount';

const mockUpgradeResult = {
  transactionHash: '0x123',
  delegatedTo: '0xabc',
};

jest.mock('@metamask/eip-7702-internal-rpc-middleware', () => ({
  walletUpgradeAccount: jest.fn().mockImplementation((_req, res) => {
    res.result = {
      transactionHash: '0x123',
      delegatedTo: '0xabc',
    };
    return Promise.resolve();
  }),
}));

const mockExternalHandler = jest.mocked(externalWalletUpgradeAccount);

const baseRequest = {
  jsonrpc: '2.0' as const,
  id: 1,
  method: 'wallet_upgradeAccount',
  origin: 'test.com',
  params: {
    account: '0xdead' as `0x${string}`,
    chainId: '0x1' as `0x${string}`,
  },
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const upgradeAccount = jest.fn().mockResolvedValue(mockUpgradeResult);
  const getCurrentChainIdForDomain = jest.fn().mockReturnValue('0x1');
  const isEip7702Supported = jest.fn().mockResolvedValue({
    isSupported: true,
    upgradeContractAddress: '0xcontract',
  });
  const getAccounts = jest.fn().mockReturnValue(['0xdead', '0xbeef']);
  const response: PendingJsonRpcResponse<typeof mockUpgradeResult> = {
    jsonrpc: '2.0' as const,
    id: 1,
  };

  const handler = (
    request: Parameters<typeof walletUpgradeAccount.implementation>[0],
  ) =>
    walletUpgradeAccount.implementation(request, response, next, end, {
      upgradeAccount,
      getCurrentChainIdForDomain,
      isEip7702Supported,
      getAccounts,
    });

  return {
    response,
    next,
    end,
    upgradeAccount,
    getCurrentChainIdForDomain,
    isEip7702Supported,
    getAccounts,
    handler,
  };
};

describe('wallet_upgradeAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has the expected method name', () => {
    expect(walletUpgradeAccount.methodNames).toStrictEqual([
      'wallet_upgradeAccount',
    ]);
  });

  it('calls the external wallet_upgradeAccount handler and ends the request', async () => {
    const { handler, end } = createMockedHandler();

    await handler(baseRequest);

    expect(mockExternalHandler).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('passes the correct hooks to the external handler', async () => {
    const {
      handler,
      upgradeAccount,
      getCurrentChainIdForDomain,
      isEip7702Supported,
    } = createMockedHandler();

    await handler(baseRequest);

    const hooksPassed = mockExternalHandler.mock.calls[0][2];
    expect(hooksPassed).toHaveProperty('upgradeAccount', upgradeAccount);
    expect(hooksPassed).toHaveProperty(
      'getCurrentChainIdForDomain',
      getCurrentChainIdForDomain,
    );
    expect(hooksPassed).toHaveProperty(
      'isEip7702Supported',
      isEip7702Supported,
    );
    expect(hooksPassed).toHaveProperty('getPermittedAccountsForOrigin');
  });

  it('returns the upgrade result in the response', async () => {
    const { handler, response } = createMockedHandler();

    await handler(baseRequest);

    expect(response.result).toStrictEqual(mockUpgradeResult);
  });

  it('getPermittedAccountsForOrigin uses request origin', async () => {
    const { handler, getAccounts } = createMockedHandler();

    await handler(baseRequest);

    const hooksPassed = mockExternalHandler.mock.calls[0][2];
    await hooksPassed.getPermittedAccountsForOrigin('test.com');

    expect(getAccounts).toHaveBeenCalledWith('test.com');
  });
});
