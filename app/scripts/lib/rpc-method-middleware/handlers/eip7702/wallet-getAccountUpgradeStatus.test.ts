import type { PendingJsonRpcResponse, Json } from '@metamask/utils';
import { walletGetAccountUpgradeStatus as externalWalletGetAccountUpgradeStatus } from '@metamask/eip-7702-internal-rpc-middleware';
import { walletGetAccountUpgradeStatus } from './wallet-getAccountUpgradeStatus';

const mockStatusResult = {
  delegated: false,
  upgradable: true,
};

jest.mock('@metamask/eip-7702-internal-rpc-middleware', () => ({
  walletGetAccountUpgradeStatus: jest.fn().mockImplementation((_req, res) => {
    res.result = {
      delegated: false,
      upgradable: true,
    };
    return Promise.resolve();
  }),
}));

const mockExternalHandler = jest.mocked(externalWalletGetAccountUpgradeStatus);

const baseRequest = {
  jsonrpc: '2.0' as const,
  id: 1,
  method: 'wallet_getAccountUpgradeStatus',
  origin: 'metamask',
  params: {
    account: '0xdead' as `0x${string}`,
    chainId: '0x1' as `0x${string}`,
  },
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getCurrentChainIdForDomain = jest.fn().mockReturnValue('0x1');
  const getCode = jest.fn().mockResolvedValue(null);
  const getSelectedNetworkClientIdForChain = jest
    .fn()
    .mockReturnValue('mainnet');
  const getAccounts = jest.fn().mockReturnValue(['0xdead', '0xbeef']);
  const isEip7702Supported = jest.fn().mockResolvedValue({
    isSupported: true,
    upgradeContractAddress: '0xcontract',
  });
  const response: PendingJsonRpcResponse<Json> = {
    jsonrpc: '2.0' as const,
    id: 1,
  };

  const handler = (
    request: Parameters<typeof walletGetAccountUpgradeStatus.implementation>[0],
  ) =>
    walletGetAccountUpgradeStatus.implementation(request, response, next, end, {
      getCurrentChainIdForDomain,
      getCode,
      getSelectedNetworkClientIdForChain,
      getAccounts,
      isEip7702Supported,
    });

  return {
    response,
    next,
    end,
    getCurrentChainIdForDomain,
    getCode,
    getSelectedNetworkClientIdForChain,
    getAccounts,
    isEip7702Supported,
    handler,
  };
};

describe('wallet_getAccountUpgradeStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has the expected method name', () => {
    expect(walletGetAccountUpgradeStatus.methodNames).toStrictEqual([
      'wallet_getAccountUpgradeStatus',
    ]);
  });

  it('calls the external wallet_getAccountUpgradeStatus handler', async () => {
    const { handler } = createMockedHandler();

    await handler(baseRequest);

    expect(mockExternalHandler).toHaveBeenCalledTimes(1);
  });

  it('passes the correct hooks to the external handler', async () => {
    const {
      handler,
      getCurrentChainIdForDomain,
      getCode,
      getSelectedNetworkClientIdForChain,
      isEip7702Supported,
    } = createMockedHandler();

    await handler(baseRequest);

    const hooksPassed = mockExternalHandler.mock.calls[0][2];
    expect(hooksPassed).toHaveProperty(
      'getCurrentChainIdForDomain',
      getCurrentChainIdForDomain,
    );
    expect(hooksPassed).toHaveProperty('getCode', getCode);
    expect(hooksPassed).toHaveProperty(
      'getSelectedNetworkClientIdForChain',
      getSelectedNetworkClientIdForChain,
    );
    expect(hooksPassed).toHaveProperty(
      'isEip7702Supported',
      isEip7702Supported,
    );
    expect(hooksPassed).toHaveProperty('getPermittedAccountsForOrigin');
  });

  it('calls end callback after processing', async () => {
    const { handler, end } = createMockedHandler();

    await handler(baseRequest);

    expect(end).toHaveBeenCalledTimes(1);
  });

  it('returns the status result in the response', async () => {
    const { handler, response } = createMockedHandler();

    await handler(baseRequest);

    expect(response.result).toStrictEqual(mockStatusResult);
  });

  it('getPermittedAccountsForOrigin uses request origin', async () => {
    const { handler, getAccounts } = createMockedHandler();

    await handler(baseRequest);

    const hooksPassed = mockExternalHandler.mock.calls[0][2];
    await hooksPassed.getPermittedAccountsForOrigin();

    expect(getAccounts).toHaveBeenCalledWith('metamask');
  });
});
