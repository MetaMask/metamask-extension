import { rpcErrors } from '@metamask/rpc-errors';

import { isSnapPreinstalled } from '../../../../../shared/lib/snaps/snaps';
import {
  upgradeAccountHandler,
  getAccountUpgradeStatusHandler,
} from './wallet-upgrade-account';

// Mock the isSnapPreinstalled function
jest.mock('../../../../../shared/lib/snaps/snaps', () => ({
  isSnapPreinstalled: jest.fn(),
}));

describe('upgradeAccountHandler', () => {
  let mockEnd: jest.Mock;
  let mockNext: jest.Mock;
  let mockUpgradeAccount: jest.Mock;
  let mockGetCurrentChainId: jest.Mock;
  let mockGetNetworkConfigurationByChainId: jest.Mock;

  beforeEach(() => {
    mockEnd = jest.fn();
    mockNext = jest.fn();
    mockUpgradeAccount = jest.fn();
    mockGetCurrentChainId = jest.fn().mockReturnValue(1);
    mockGetNetworkConfigurationByChainId = jest
      .fn()
      .mockImplementation((chainId) => {
        if (chainId === '0x1' || chainId === '0xaa36a7') {
          return {
            upgradeContractAddress:
              '0x0000000000000000000000000000000000000000',
          };
        }
        return null;
      });
    // Mock isSnapPreinstalled to return true by default
    jest.mocked(isSnapPreinstalled).mockReturnValue(true);
    jest.clearAllMocks();
  });

  describe('preinstalled snap restriction', () => {
    it('should reject non-preinstalled snap', async () => {
      jest.mocked(isSnapPreinstalled).mockReturnValue(false);

      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@some-other-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.methodNotFound({
          message:
            'wallet_upgradeAccount is only available to preinstalled snaps',
        }),
      );
      expect(mockUpgradeAccount).not.toHaveBeenCalled();
    });

    it('should allow preinstalled snap', async () => {
      jest.mocked(isSnapPreinstalled).mockReturnValue(true);
      mockUpgradeAccount.mockResolvedValue({
        transactionHash: '0xabc123',
        delegatedTo: '0x0000000000000000000000000000000000000000',
      });

      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockUpgradeAccount).toHaveBeenCalled();
      expect(mockEnd).toHaveBeenCalledWith();
    });
  });

  describe('parameter validation', () => {
    it('should reject empty params', async () => {
      const req = {
        params: [],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.invalidParams({
          message: 'Expected non-empty array parameter',
        }),
      );
    });

    it('should reject missing account', async () => {
      const req = {
        params: [{}],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.invalidParams({
          message: 'account address is required',
        }),
      );
    });

    it('should reject empty account', async () => {
      const req = {
        params: [{ account: '' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.invalidParams({
          message: 'account address is required',
        }),
      );
    });
  });

  describe('successful upgrade', () => {
    it('should upgrade account with current chain ID', async () => {
      mockUpgradeAccount.mockResolvedValue({
        transactionHash: '0xabc123',
        delegatedTo: '0x0000000000000000000000000000000000000000',
      });

      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockGetCurrentChainId).toHaveBeenCalled();
      expect(mockUpgradeAccount).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        '0x0000000000000000000000000000000000000000',
        1,
      );
      expect(res.result).toEqual({
        transactionHash: '0xabc123',
        upgradedAccount: '0x1234567890123456789012345678901234567890',
        delegatedTo: '0x0000000000000000000000000000000000000000',
      });
      expect(mockEnd).toHaveBeenCalledWith();
    });

    it('should upgrade account with specified chain ID', async () => {
      mockUpgradeAccount.mockResolvedValue({
        transactionHash: '0xdef456',
        delegatedTo: '0x0000000000000000000000000000000000000000',
      });

      const req = {
        params: [
          {
            account: '0x1234567890123456789012345678901234567890',
            chainId: 11155111,
          },
        ],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockGetCurrentChainId).not.toHaveBeenCalled();
      expect(mockUpgradeAccount).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        '0x0000000000000000000000000000000000000000',
        11155111,
      );
      expect(res.result).toEqual({
        transactionHash: '0xdef456',
        upgradedAccount: '0x1234567890123456789012345678901234567890',
        delegatedTo: '0x0000000000000000000000000000000000000000',
      });
      expect(mockEnd).toHaveBeenCalledWith();
    });
  });

  describe('error handling', () => {
    it('should handle unsupported chain ID', async () => {
      mockGetNetworkConfigurationByChainId.mockReturnValue(null);

      const req = {
        params: [
          {
            account: '0x1234567890123456789012345678901234567890',
            chainId: 999999,
          },
        ],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.invalidParams({
          message: 'Account upgrade not supported on chain ID 999999',
        }),
      );
      expect(mockUpgradeAccount).not.toHaveBeenCalled();
    });

    it('should handle network config without upgrade contract address', async () => {
      mockGetNetworkConfigurationByChainId.mockReturnValue({
        // No upgradeContractAddress property
      });

      const req = {
        params: [
          {
            account: '0x1234567890123456789012345678901234567890',
            chainId: 1,
          },
        ],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.invalidParams({
          message: 'Account upgrade not supported on chain ID 1',
        }),
      );
      expect(mockUpgradeAccount).not.toHaveBeenCalled();
    });

    it('should handle upgrade failure', async () => {
      mockUpgradeAccount.mockRejectedValue(new Error('Upgrade failed'));

      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.internal({
          message: 'Failed to upgrade account: Upgrade failed',
        }),
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockUpgradeAccount.mockRejectedValue('String error');

      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_upgradeAccount',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await upgradeAccountHandler.implementation(req, res, mockNext, mockEnd, {
        upgradeAccount: mockUpgradeAccount,
        getCurrentChainId: mockGetCurrentChainId,
        getNetworkConfigurationByChainId: mockGetNetworkConfigurationByChainId,
      });

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.internal({
          message: 'Failed to upgrade account: String error',
        }),
      );
    });
  });
});

describe('getAccountUpgradeStatusHandler', () => {
  let mockEnd: jest.Mock;
  let mockNext: jest.Mock;
  let mockGetCurrentChainId: jest.Mock;
  let mockGetCode: jest.Mock;
  let mockGetNetworkConfigurationByChainId: jest.Mock;

  beforeEach(() => {
    mockEnd = jest.fn();
    mockNext = jest.fn();
    mockGetCurrentChainId = jest.fn().mockReturnValue(1);
    mockGetCode = jest.fn();
    mockGetNetworkConfigurationByChainId = jest
      .fn()
      .mockImplementation((chainId) => {
        if (chainId === '0x1' || chainId === '0xaa36a7') {
          return {
            rpcEndpoints: [
              {
                networkClientId: 'mainnet-1',
              },
            ],
            defaultRpcEndpointIndex: 0,
          };
        }
        return null;
      });
    // Mock isSnapPreinstalled to return true by default
    jest.mocked(isSnapPreinstalled).mockReturnValue(true);
    jest.clearAllMocks();
  });

  describe('preinstalled snap restriction', () => {
    it('should reject non-preinstalled snap', async () => {
      jest.mocked(isSnapPreinstalled).mockReturnValue(false);

      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@some-other-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.methodNotFound({
          message:
            'wallet_getAccountUpgradeStatus is only available to preinstalled snaps',
        }),
      );
      expect(mockGetCode).not.toHaveBeenCalled();
    });

    it('should allow preinstalled snap', async () => {
      jest.mocked(isSnapPreinstalled).mockReturnValue(true);
      mockGetCode.mockResolvedValue('0x1234567890abcdef');

      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockGetCode).toHaveBeenCalled();
      expect(mockEnd).toHaveBeenCalledWith();
    });
  });

  describe('parameter validation', () => {
    it('should reject empty params', async () => {
      const req = {
        params: [],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.invalidParams({
          message: 'Expected non-empty array parameter',
        }),
      );
    });

    it('should reject missing account', async () => {
      const req = {
        params: [{}],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.invalidParams({
          message: 'account address is required',
        }),
      );
    });
  });

  describe('network validation', () => {
    it('should reject unknown chain ID', async () => {
      const req = {
        params: [
          {
            account: '0x1234567890123456789012345678901234567890',
            chainId: 999,
          },
        ],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      mockGetNetworkConfigurationByChainId.mockReturnValue(null);

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.invalidParams({
          message: 'Network not found for chain ID 999',
        }),
      );
    });

    it('should reject missing network client ID', async () => {
      const req = {
        params: [
          { account: '0x1234567890123456789012345678901234567890', chainId: 1 },
        ],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      mockGetNetworkConfigurationByChainId.mockReturnValue({
        rpcEndpoints: [{ networkClientId: null }],
        defaultRpcEndpointIndex: 0,
      });

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.invalidParams({
          message: 'Network client ID not found for chain ID 1',
        }),
      );
    });
  });

  describe('successful status check', () => {
    it('should return upgrade status for upgraded account', async () => {
      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      mockGetCode.mockResolvedValue('0x1234567890abcdef');

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockGetCode).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        'mainnet-1',
      );
      expect(res.result).toEqual({
        account: '0x1234567890123456789012345678901234567890',
        isUpgraded: true,
        chainId: 1,
      });
      expect(mockEnd).toHaveBeenCalledWith();
    });

    it('should return upgrade status for non-upgraded account', async () => {
      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      mockGetCode.mockResolvedValue('0x');

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockGetCode).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        'mainnet-1',
      );
      expect(res.result).toEqual({
        account: '0x1234567890123456789012345678901234567890',
        isUpgraded: false,
        chainId: 1,
      });
      expect(mockEnd).toHaveBeenCalledWith();
    });

    it('should use custom chain ID when provided', async () => {
      const req = {
        params: [
          { account: '0x1234567890123456789012345678901234567890', chainId: 5 },
        ],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      mockGetNetworkConfigurationByChainId.mockReturnValue({
        rpcEndpoints: [
          {
            networkClientId: 'goerli-5',
          },
        ],
        defaultRpcEndpointIndex: 0,
      });
      mockGetCode.mockResolvedValue('0x1234567890abcdef');

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockGetCode).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        'goerli-5',
      );
      expect(res.result).toEqual({
        account: '0x1234567890123456789012345678901234567890',
        isUpgraded: true,
        chainId: 5,
      });
      expect(mockEnd).toHaveBeenCalledWith();
    });
  });

  describe('error handling', () => {
    it('should handle getCode errors', async () => {
      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      mockGetCode.mockRejectedValue(new Error('Network error'));

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.internal({
          message: 'Failed to get account upgrade status: Network error',
        }),
      );
    });

    it('should handle non-Error exceptions', async () => {
      const req = {
        params: [{ account: '0x1234567890123456789012345678901234567890' }],
        origin: 'npm:@metamask/gator-permissions-snap',
        id: 1,
        method: 'wallet_getAccountUpgradeStatus',
        jsonrpc: '2.0' as const,
      };

      const res = { result: null, id: 1, jsonrpc: '2.0' as const };

      mockGetCode.mockRejectedValue('String error');

      await getAccountUpgradeStatusHandler.implementation(
        req,
        res,
        mockNext,
        mockEnd,
        {
          getCurrentChainId: mockGetCurrentChainId,
          getCode: mockGetCode,
          getNetworkConfigurationByChainId:
            mockGetNetworkConfigurationByChainId,
        },
      );

      expect(mockEnd).toHaveBeenCalledWith(
        rpcErrors.internal({
          message: 'Failed to get account upgrade status: String error',
        }),
      );
    });
  });
});
