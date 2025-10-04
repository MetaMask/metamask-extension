import { rpcErrors } from '@metamask/rpc-errors';
import type { JsonRpcRequest, Json } from '@metamask/utils';
import { isSnapPreinstalled } from '../../../../../shared/lib/snaps/snaps';
import {
  upgradeAccountHandler,
  getAccountUpgradeStatusHandler,
} from './wallet-upgrade-account';

jest.mock('../../../../../shared/lib/snaps/snaps', () => ({
  isSnapPreinstalled: jest.fn().mockReturnValue(true),
}));

const TEST_ACCOUNT = '0x1234567890123456789012345678901234567890';
const UPGRADE_CONTRACT = '0x0000000000000000000000000000000000000000';

const createUpgradeHandler = () => {
  const end = jest.fn();
  const next = jest.fn();
  const upgradeAccount = jest.fn();
  const getCurrentChainId = jest.fn().mockReturnValue(1);
  const isAtomicBatchSupported = jest
    .fn()
    .mockImplementation(async ({ chainIds }: { chainIds: string[] }) => {
      return chainIds.map((chainId: string) => {
        if (chainId === '0x1' || chainId === '0xaa36a7') {
          return {
            chainId,
            isSupported: true,
            upgradeContractAddress: UPGRADE_CONTRACT,
          };
        }
        return {
          chainId,
          isSupported: false,
        };
      });
    });

  const response = { result: null, id: 1, jsonrpc: '2.0' as const };
  const handler = (request: JsonRpcRequest<Json[]> & { origin: string }) =>
    upgradeAccountHandler.implementation(request, response, next, end, {
      upgradeAccount,
      getCurrentChainId,
      isAtomicBatchSupported,
    });

  return {
    end,
    next,
    upgradeAccount,
    getCurrentChainId,
    isAtomicBatchSupported,
    response,
    handler,
  };
};

const createStatusHandler = () => {
  const end = jest.fn();
  const next = jest.fn();
  const getCurrentChainId = jest.fn().mockReturnValue(1);
  const getCode = jest.fn();
  const getNetworkConfigurationByChainId = jest
    .fn()
    .mockImplementation((chainId) => {
      if (chainId === '0x1' || chainId === '0xaa36a7') {
        return {
          rpcEndpoints: [{ networkClientId: 'mainnet-1' }],
          defaultRpcEndpointIndex: 0,
        };
      }
      return null;
    });

  const response = { result: null, id: 1, jsonrpc: '2.0' as const };
  const handler = (request: JsonRpcRequest<Json[]> & { origin: string }) =>
    getAccountUpgradeStatusHandler.implementation(
      request,
      response,
      next,
      end,
      {
        getCurrentChainId,
        getCode,
        getNetworkConfigurationByChainId,
      },
    );

  return {
    end,
    next,
    getCurrentChainId,
    getCode,
    getNetworkConfigurationByChainId,
    response,
    handler,
  };
};

describe('upgradeAccountHandler', () => {
  beforeEach(() => {
    jest.mocked(isSnapPreinstalled).mockReturnValue(true);
    jest.clearAllMocks();
  });

  it('rejects non-preinstalled snap', async () => {
    const { end, handler } = createUpgradeHandler();
    jest.mocked(isSnapPreinstalled).mockReturnValue(false);

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@some-other-snap',
      params: [{ account: TEST_ACCOUNT }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.methodNotFound({
        message:
          'wallet_upgradeAccount is only available to preinstalled snaps',
      }),
    );
  });

  it('rejects empty params', async () => {
    const { end, handler } = createUpgradeHandler();

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'Expected non-empty array parameter',
      }),
    );
  });

  it('rejects missing account', async () => {
    const { end, handler } = createUpgradeHandler();

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{}],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({ message: 'account address is required' }),
    );
  });

  it('rejects empty account', async () => {
    const { end, handler } = createUpgradeHandler();

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: '' }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'account address is required',
      }),
    );
  });

  it('upgrades account with current chain ID', async () => {
    const { end, upgradeAccount, getCurrentChainId, response, handler } =
      createUpgradeHandler();
    upgradeAccount.mockResolvedValue({
      transactionHash: '0xabc123',
      delegatedTo: UPGRADE_CONTRACT,
    });

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT }],
    });

    expect(getCurrentChainId).toHaveBeenCalled();
    expect(upgradeAccount).toHaveBeenCalledWith(
      TEST_ACCOUNT,
      UPGRADE_CONTRACT,
      1,
    );
    expect(response.result).toEqual({
      transactionHash: '0xabc123',
      upgradedAccount: TEST_ACCOUNT,
      delegatedTo: UPGRADE_CONTRACT,
    });
    expect(end).toHaveBeenCalledWith();
  });

  it('upgrades account with specified chain ID', async () => {
    const { end, upgradeAccount, getCurrentChainId, response, handler } =
      createUpgradeHandler();
    upgradeAccount.mockResolvedValue({
      transactionHash: '0xdef456',
      delegatedTo: UPGRADE_CONTRACT,
    });

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT, chainId: 11155111 }],
    });

    expect(getCurrentChainId).not.toHaveBeenCalled();
    expect(upgradeAccount).toHaveBeenCalledWith(
      TEST_ACCOUNT,
      UPGRADE_CONTRACT,
      11155111,
    );
    expect(response.result).toEqual({
      transactionHash: '0xdef456',
      upgradedAccount: TEST_ACCOUNT,
      delegatedTo: UPGRADE_CONTRACT,
    });
    expect(end).toHaveBeenCalledWith();
  });

  it('rejects unsupported chain ID', async () => {
    const { end, upgradeAccount, isAtomicBatchSupported, handler } =
      createUpgradeHandler();
    isAtomicBatchSupported.mockResolvedValue([]);

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT, chainId: 999999 }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'Account upgrade not supported on chain ID 999999',
      }),
    );
    expect(upgradeAccount).not.toHaveBeenCalled();
  });

  it('rejects network config without upgrade contract', async () => {
    const { end, upgradeAccount, isAtomicBatchSupported, handler } =
      createUpgradeHandler();
    isAtomicBatchSupported.mockResolvedValue([
      {
        chainId: '0x1',
        isSupported: false,
      },
    ]);

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT, chainId: 1 }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'Account upgrade not supported on chain ID 1',
      }),
    );
    expect(upgradeAccount).not.toHaveBeenCalled();
  });

  it('handles upgrade failure', async () => {
    const { end, upgradeAccount, handler } = createUpgradeHandler();
    upgradeAccount.mockRejectedValue(new Error('Upgrade failed'));

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.internal({
        message: 'Failed to upgrade account: Upgrade failed',
      }),
    );
  });

  it('handles non-Error exceptions', async () => {
    const { end, upgradeAccount, handler } = createUpgradeHandler();
    upgradeAccount.mockRejectedValue('String error');

    await handler({
      id: 1,
      method: 'wallet_upgradeAccount',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.internal({
        message: 'Failed to upgrade account: String error',
      }),
    );
  });
});

describe('getAccountUpgradeStatusHandler', () => {
  beforeEach(() => {
    jest.mocked(isSnapPreinstalled).mockReturnValue(true);
    jest.clearAllMocks();
  });

  it('rejects non-preinstalled snap', async () => {
    const { end, getCode, handler } = createStatusHandler();
    jest.mocked(isSnapPreinstalled).mockReturnValue(false);

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@some-other-snap',
      params: [{ account: TEST_ACCOUNT }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.methodNotFound({
        message:
          'wallet_getAccountUpgradeStatus is only available to preinstalled snaps',
      }),
    );
    expect(getCode).not.toHaveBeenCalled();
  });

  it('rejects empty params', async () => {
    const { end, handler } = createStatusHandler();

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'Expected non-empty array parameter',
      }),
    );
  });

  it('rejects missing account', async () => {
    const { end, handler } = createStatusHandler();

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{}],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({ message: 'account address is required' }),
    );
  });

  it('rejects unknown chain ID', async () => {
    const { end, getNetworkConfigurationByChainId, handler } =
      createStatusHandler();
    getNetworkConfigurationByChainId.mockReturnValue(null);

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT, chainId: 999 }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'Network not found for chain ID 999',
      }),
    );
  });

  it('rejects missing network client ID', async () => {
    const { end, getNetworkConfigurationByChainId, handler } =
      createStatusHandler();
    getNetworkConfigurationByChainId.mockReturnValue({
      rpcEndpoints: [{ networkClientId: null }],
      defaultRpcEndpointIndex: 0,
    });

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT, chainId: 1 }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'Network client ID not found for chain ID 1',
      }),
    );
  });

  it('rejects invalid RPC endpoint index (negative)', async () => {
    const { end, getNetworkConfigurationByChainId, handler } =
      createStatusHandler();
    getNetworkConfigurationByChainId.mockReturnValue({
      rpcEndpoints: [{ networkClientId: 'mainnet-1' }],
      defaultRpcEndpointIndex: -1,
    });

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT, chainId: 1 }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'Network configuration invalid for chain ID 1',
      }),
    );
  });

  it('rejects invalid RPC endpoint index (out of bounds)', async () => {
    const { end, getNetworkConfigurationByChainId, handler } =
      createStatusHandler();
    getNetworkConfigurationByChainId.mockReturnValue({
      rpcEndpoints: [{ networkClientId: 'mainnet-1' }],
      defaultRpcEndpointIndex: 5,
    });

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT, chainId: 1 }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'Network configuration invalid for chain ID 1',
      }),
    );
  });

  it('rejects empty RPC endpoints array', async () => {
    const { end, getNetworkConfigurationByChainId, handler } =
      createStatusHandler();
    getNetworkConfigurationByChainId.mockReturnValue({
      rpcEndpoints: [],
      defaultRpcEndpointIndex: 0,
    });

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT, chainId: 1 }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.invalidParams({
        message: 'Network configuration invalid for chain ID 1',
      }),
    );
  });

  it('returns upgrade status for upgraded account', async () => {
    const { end, getCode, response, handler } = createStatusHandler();
    getCode.mockResolvedValue('0x1234567890abcdef');

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT }],
    });

    expect(getCode).toHaveBeenCalledWith(TEST_ACCOUNT, 'mainnet-1');
    expect(response.result).toEqual({
      account: TEST_ACCOUNT,
      isUpgraded: true,
      chainId: 1,
    });
    expect(end).toHaveBeenCalledWith();
  });

  it('returns upgrade status for non-upgraded account', async () => {
    const { end, getCode, response, handler } = createStatusHandler();
    getCode.mockResolvedValue('0x');

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT }],
    });

    expect(getCode).toHaveBeenCalledWith(TEST_ACCOUNT, 'mainnet-1');
    expect(response.result).toEqual({
      account: TEST_ACCOUNT,
      isUpgraded: false,
      chainId: 1,
    });
    expect(end).toHaveBeenCalledWith();
  });

  it('uses custom chain ID when provided', async () => {
    const {
      end,
      getCode,
      getNetworkConfigurationByChainId,
      response,
      handler,
    } = createStatusHandler();
    getNetworkConfigurationByChainId.mockReturnValue({
      rpcEndpoints: [{ networkClientId: 'goerli-5' }],
      defaultRpcEndpointIndex: 0,
    });
    getCode.mockResolvedValue('0x1234567890abcdef');

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT, chainId: 5 }],
    });

    expect(getCode).toHaveBeenCalledWith(TEST_ACCOUNT, 'goerli-5');
    expect(response.result).toEqual({
      account: TEST_ACCOUNT,
      isUpgraded: true,
      chainId: 5,
    });
    expect(end).toHaveBeenCalledWith();
  });

  it('handles getCode errors', async () => {
    const { end, getCode, handler } = createStatusHandler();
    getCode.mockRejectedValue(new Error('Network error'));

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.internal({
        message: 'Failed to get account upgrade status: Network error',
      }),
    );
  });

  it('handles non-Error exceptions', async () => {
    const { end, getCode, handler } = createStatusHandler();
    getCode.mockRejectedValue('String error');

    await handler({
      id: 1,
      method: 'wallet_getAccountUpgradeStatus',
      jsonrpc: '2.0',
      origin: 'npm:@metamask/gator-permissions-snap',
      params: [{ account: TEST_ACCOUNT }],
    });

    expect(end).toHaveBeenCalledWith(
      rpcErrors.internal({
        message: 'Failed to get account upgrade status: String error',
      }),
    );
  });
});
