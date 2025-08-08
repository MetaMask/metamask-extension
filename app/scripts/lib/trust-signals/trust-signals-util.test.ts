import { JsonRpcRequest } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import * as networksModule from '../../../../shared/modules/selectors/networks';
import {
  isEthSendTransaction,
  hasValidTransactionParams,
  isEthSignTypedData,
  hasValidTypedDataParams,
  getChainId,
  isConnected,
  connectScreenHasBeenPrompted,
  mapChainIdToSupportedEVMChain,
} from './trust-signals-util';
import { SupportedEVMChain } from './types';

jest.mock('../../../../shared/modules/selectors/networks');

describe('trust-signals-util', () => {
  describe('isEthSendTransaction', () => {
    it('should return true for eth_sendTransaction method', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSendTransaction(req)).toBe(true);
    });

    it('should return false for other methods', () => {
      const req: JsonRpcRequest = {
        method: 'eth_getBalance',
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSendTransaction(req)).toBe(false);
    });
  });

  describe('hasValidTransactionParams', () => {
    it('should return true for valid transaction params with "to" field', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [
          {
            to: '0x1234567890123456789012345678901234567890',
            from: '0xabcdef0123456789012345678901234567890123',
            value: '0x0',
            chainId: '0x1',
          },
        ],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(true);
    });

    it('should return false when params is not present', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when params is not an array', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: null as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when params array is empty', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when first param is not an object', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: ['not an object'],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when first param is null', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [null],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when "to" field is missing', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [
          {
            from: '0xabcdef0123456789012345678901234567890123',
            value: '0x0',
            chainId: '0x1',
          },
        ],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });
  });

  describe('isEthSignTypedData', () => {
    it('should return true for ETH_SIGN_TYPED_DATA', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(true);
    });

    it('should return true for ETH_SIGN_TYPED_DATA_V1', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(true);
    });

    it('should return true for ETH_SIGN_TYPED_DATA_V3', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(true);
    });

    it('should return true for ETH_SIGN_TYPED_DATA_V4', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(true);
    });

    it('should return false for other methods', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(false);
    });
  });

  describe('hasValidTypedDataParams', () => {
    it('should return true for valid typed data params', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress', { domain: {}, message: {} }],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(true);
    });

    it('should return true when second param is a string', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress', '{"domain":{}}'],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(true);
    });

    it('should return false when params is not present', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(hasValidTypedDataParams(req)).toBe(false);
    });

    it('should return false when params is not an array', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: null as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(false);
    });

    it('should return false when params has less than 2 elements', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress'],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(false);
    });

    it('should return false when second param is undefined', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress', undefined as any], // eslint-disable-line @typescript-eslint/no-explicit-any
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(false);
    });

    it('should return false when second param is null', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress', null],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(false);
    });
  });

  describe('getChainId', () => {
    const mockedGetProviderConfig = jest.mocked(
      networksModule.getProviderConfig,
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return Ethereum for mainnet chain ID', () => {
      const mockNetworkController = {
        state: { providerConfig: { chainId: CHAIN_IDS.MAINNET } },
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      mockedGetProviderConfig.mockReturnValue({
        chainId: CHAIN_IDS.MAINNET,
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(getChainId(mockNetworkController)).toBe(
        SupportedEVMChain.Ethereum,
      );
    });

    it('should return Polygon for polygon chain ID', () => {
      const mockNetworkController = {
        state: { providerConfig: { chainId: CHAIN_IDS.POLYGON } },
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      mockedGetProviderConfig.mockReturnValue({
        chainId: CHAIN_IDS.POLYGON,
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(getChainId(mockNetworkController)).toBe(SupportedEVMChain.Polygon);
    });

    it('should return correct chain for various supported chains', () => {
      const testCases = [
        { chainId: CHAIN_IDS.ARBITRUM, expected: SupportedEVMChain.Arbitrum },
        { chainId: CHAIN_IDS.AVALANCHE, expected: SupportedEVMChain.Avalanche },
        { chainId: CHAIN_IDS.BASE, expected: SupportedEVMChain.Base },
        { chainId: CHAIN_IDS.BSC, expected: SupportedEVMChain.Bsc },
        { chainId: CHAIN_IDS.OPTIMISM, expected: SupportedEVMChain.Optimism },
        {
          chainId: CHAIN_IDS.SEPOLIA,
          expected: SupportedEVMChain.EthereumSepolia,
        },
      ];

      testCases.forEach(({ chainId, expected }) => {
        const mockNetworkController = {
          state: { providerConfig: { chainId } },
        } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        mockedGetProviderConfig.mockReturnValue({
          chainId,
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        expect(getChainId(mockNetworkController)).toBe(expected);
      });
    });

    it('should handle lowercase chain IDs', () => {
      const mockNetworkController = {
        state: { providerConfig: { chainId: '0X1' } },
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      mockedGetProviderConfig.mockReturnValue({
        chainId: '0X1', // Uppercase
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(getChainId(mockNetworkController)).toBe(
        SupportedEVMChain.Ethereum,
      );
    });

    it('should throw error when chain ID is not found', () => {
      const mockNetworkController = {
        state: { providerConfig: {} },
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      mockedGetProviderConfig.mockReturnValue({} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(() => getChainId(mockNetworkController)).toThrow(
        'Chain ID not found',
      );
    });

    it('should throw error when provider config is undefined', () => {
      const mockNetworkController = {
        state: { providerConfig: {} },
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      mockedGetProviderConfig.mockReturnValue(undefined as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(() => getChainId(mockNetworkController)).toThrow(
        'Chain ID not found',
      );
    });

    it('should handle custom chain IDs', () => {
      const customChainMappings = [
        { chainId: '0x76adf1', expected: SupportedEVMChain.Zora },
        { chainId: '0x27bc86aa', expected: SupportedEVMChain.Degen },
        { chainId: '0x343b', expected: SupportedEVMChain.ImmutableZkevm },
        { chainId: '0x1e0', expected: SupportedEVMChain.Worldchain },
        { chainId: '0x79a', expected: SupportedEVMChain.SoneiumMinato },
        { chainId: '0x7e4', expected: SupportedEVMChain.Ronin },
      ];

      customChainMappings.forEach(({ chainId, expected }) => {
        const mockNetworkController = {
          state: { providerConfig: { chainId } },
        } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

        mockedGetProviderConfig.mockReturnValue({
          chainId,
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        expect(getChainId(mockNetworkController)).toBe(expected);
      });
    });
  });

  describe('isConnected', () => {
    it('returns true when the user is connected', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_ACCOUNTS,
        origin: 'https://example.com',
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue(['0x123']);
      expect(isConnected(req, getPermittedAccounts)).toBe(true);
    });

    it('returns false when the user is not connected', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_ACCOUNTS,
        origin: 'https://example.com',
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue([]);
      expect(isConnected(req, getPermittedAccounts)).toBe(false);
    });

    it('returns false when the method is not eth_accounts', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        origin: 'https://example.com',
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue(['0x123']);
      expect(isConnected(req, getPermittedAccounts)).toBe(false);
    });

    it('returns false when the origin is not present', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_ACCOUNTS,
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue(['0x123']);
      expect(isConnected(req, getPermittedAccounts)).toBe(false);
    });
    it('returns false even if connected but different method', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        origin: 'https://example.com',
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue(['0x123']);
      expect(isConnected(req, getPermittedAccounts)).toBe(false);
    });
  });

  describe('connectScreenHasBeenPrompted', () => {
    it('returns true when the method is eth_request_accounts', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(connectScreenHasBeenPrompted(req)).toBe(true);
    });

    it('returns true when the method is wallet_request_permissions', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(connectScreenHasBeenPrompted(req)).toBe(true);
    });

    it('returns false when the method is not eth_request_accounts or wallet_request_permissions', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(connectScreenHasBeenPrompted(req)).toBe(false);
    });
  });

  describe('mapChainIdToSupportedEVMChain', () => {
    describe('supported chain mappings', () => {
      const supportedChainTestCases = [
        { chainId: CHAIN_IDS.ARBITRUM, expected: SupportedEVMChain.Arbitrum, description: 'arbitrum' },
        { chainId: CHAIN_IDS.AVALANCHE, expected: SupportedEVMChain.Avalanche, description: 'avalanche' },
        { chainId: CHAIN_IDS.BASE, expected: SupportedEVMChain.Base, description: 'base' },
        { chainId: CHAIN_IDS.BASE_SEPOLIA, expected: SupportedEVMChain.BaseSepolia, description: 'base sepolia' },
        { chainId: CHAIN_IDS.BSC, expected: SupportedEVMChain.Bsc, description: 'bsc' },
        { chainId: CHAIN_IDS.MAINNET, expected: SupportedEVMChain.Ethereum, description: 'mainnet' },
        { chainId: CHAIN_IDS.OPTIMISM, expected: SupportedEVMChain.Optimism, description: 'optimism' },
        { chainId: CHAIN_IDS.POLYGON, expected: SupportedEVMChain.Polygon, description: 'polygon' },
        { chainId: CHAIN_IDS.SEPOLIA, expected: SupportedEVMChain.EthereumSepolia, description: 'sepolia' },
        { chainId: CHAIN_IDS.ZKSYNC_ERA, expected: SupportedEVMChain.Zksync, description: 'zksync era' },
        { chainId: CHAIN_IDS.ZK_SYNC_ERA_TESTNET, expected: SupportedEVMChain.ZksyncSepolia, description: 'zksync era testnet' },
        { chainId: '0x76adf1', expected: SupportedEVMChain.Zora, description: 'zora' },
        { chainId: CHAIN_IDS.LINEA_MAINNET, expected: SupportedEVMChain.Linea, description: 'linea' },
        { chainId: CHAIN_IDS.BLAST, expected: SupportedEVMChain.Blast, description: 'blast' },
        { chainId: CHAIN_IDS.SCROLL, expected: SupportedEVMChain.Scroll, description: 'scroll' },
        { chainId: CHAIN_IDS.SEPOLIA, expected: SupportedEVMChain.EthereumSepolia, description: 'sepolia' },
        { chainId: '0x27bc86aa', expected: SupportedEVMChain.Degen, description: 'degen' },
        { chainId: CHAIN_IDS.AVALANCHE_TESTNET, expected: SupportedEVMChain.AvalancheFuji, description: 'avalanche testnet' },
        { chainId: '0x343b', expected: SupportedEVMChain.ImmutableZkevm, description: 'immutable zkevm' },
        { chainId: '0x34a1', expected: SupportedEVMChain.ImmutableZkevmTestnet, description: 'immutable zkevm testnet' },
        { chainId: CHAIN_IDS.GNOSIS, expected: SupportedEVMChain.Gnosis, description: 'gnosis' },
        { chainId: '0x1e0', expected: SupportedEVMChain.Worldchain, description: 'worldchain' },
        { chainId: '0x79a', expected: SupportedEVMChain.SoneiumMinato, description: 'soneium minato' },
        { chainId: '0x7e4', expected: SupportedEVMChain.Ronin, description: 'ronin' },
        { chainId: CHAIN_IDS.APECHAIN_MAINNET, expected: SupportedEVMChain.ApeChain, description: 'apechain' },
        { chainId: '0x849ea', expected: SupportedEVMChain.ZeroNetwork, description: 'zero network' },
        { chainId: CHAIN_IDS.BERACHAIN, expected: SupportedEVMChain.Berachain, description: 'berachain' },
        { chainId: '0x138c5', expected: SupportedEVMChain.BerachainBartio, description: 'berachain bartio' },
        { chainId: CHAIN_IDS.INK, expected: SupportedEVMChain.Ink, description: 'ink' },
        { chainId: CHAIN_IDS.INK_SEPOLIA, expected: SupportedEVMChain.InkSepolia, description: 'ink sepolia' },
        { chainId: '0xab5', expected: SupportedEVMChain.Abstract, description: 'abstract' },
        { chainId: '0x2b74', expected: SupportedEVMChain.AbstractTestnet, description: 'abstract testnet' },
        { chainId: '0x74c', expected: SupportedEVMChain.Soneium, description: 'soneium' },
        { chainId: CHAIN_IDS.UNICHAIN, expected: SupportedEVMChain.Unichain, description: 'unichain' },
        { chainId: CHAIN_IDS.SEI, expected: SupportedEVMChain.Sei, description: 'sei' },
        { chainId: CHAIN_IDS.FLOW, expected: SupportedEVMChain.FlowEvm, description: 'flow' },
      ];

      supportedChainTestCases.forEach(({ chainId, expected, description }) => {
        it(`should map ${description} chainId (${chainId}) to ${expected}`, () => {
          expect(mapChainIdToSupportedEVMChain(chainId)).toBe(expected);
        });
      });
    });

    describe('case insensitive handling', () => {
      const caseTestCases = [
        { chainId: '0X1', expected: SupportedEVMChain.Ethereum, description: 'uppercase mainnet' },
        { chainId: '0xA86A', expected: SupportedEVMChain.Avalanche, description: 'uppercase avalanche' },
      ];

      caseTestCases.forEach(({ chainId, expected, description }) => {
        it(`should handle case insensitive chainId: ${description} (${chainId})`, () => {
          expect(mapChainIdToSupportedEVMChain(chainId)).toBe(expected);
        });
      });
    });

    describe('unsupported chains', () => {
      const unsupportedTestCases = [
        { chainId: '0x999999', description: 'unknown hex chainId' },
        { chainId: '0xabc123', description: 'invalid hex chainId' },
        { chainId: '', description: 'empty string' },
      ];

      unsupportedTestCases.forEach(({ chainId, description }) => {
        it(`should return undefined for ${description}: ${chainId}`, () => {
          expect(mapChainIdToSupportedEVMChain(chainId)).toBeUndefined();
        });
      });
    });
  });
});
