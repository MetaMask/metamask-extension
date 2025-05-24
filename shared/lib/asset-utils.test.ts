import {
  CaipAssetType,
  CaipAssetTypeStruct,
  CaipChainId,
  Hex,
} from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { MultichainNetwork } from '@metamask/multichain-transactions-controller';
import { toHex } from '@metamask/controller-utils';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { MINUTE } from '../constants/time';
import { MultichainNetworks } from '../constants/multichain/networks';
import fetchWithCache from './fetch-with-cache';
import { getAssetImageUrl, fetchAssetMetadata, toAssetId } from './asset-utils';

jest.mock('./fetch-with-cache');
jest.mock('@metamask/multichain-network-controller');
jest.mock('@metamask/controller-utils');

describe('asset-utils', () => {
  const STATIC_METAMASK_BASE_URL = 'https://static.cx.metamask.io';
  const TOKEN_API_V3_BASE_URL = 'https://tokens.api.cx.metamask.io/v3';

  describe('toAssetId', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return the same asset ID if input is already a CAIP asset type', () => {
      const caipAssetId = CaipAssetTypeStruct.create('eip155:1/erc20:0x123');
      const chainId = 'eip155:1' as CaipChainId;

      const result = toAssetId(caipAssetId, chainId);
      expect(result).toBe(caipAssetId);
    });

    it('should return native asset ID for native EVM address', () => {
      const nativeAddress = '0x0000000000000000000000000000000000000000';
      const chainId = 'eip155:1' as CaipChainId;

      const result = toAssetId(nativeAddress, chainId);
      expect(result).toBe(getNativeAssetForChainId(chainId).assetId);
      expect(CaipAssetTypeStruct.validate(result)).toStrictEqual([
        undefined,
        result,
      ]);
    });

    it('should return native asset ID for null EVM address', () => {
      const nativeAddress = null;
      const chainId = 'eip155:1' as CaipChainId;

      const result = toAssetId(nativeAddress as never, chainId);
      expect(result).toBe(getNativeAssetForChainId(chainId).assetId);
      expect(CaipAssetTypeStruct.validate(result)).toStrictEqual([
        undefined,
        result,
      ]);
    });

    it('should return undefined if getNativeAssetForChainId throws an error', () => {
      const nativeAddress = '0x0000000000000000000000000000000000000000';
      const chainId = 'eip155:1231' as CaipChainId;

      expect(() => toAssetId(nativeAddress, chainId)).toThrow(
        'No XChain Swaps native asset found for chainId: eip155:1231',
      );
    });

    it('should create Solana token asset ID correctly', () => {
      const address = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const chainId = MultichainNetwork.Solana as CaipChainId;

      const result = toAssetId(address, chainId);
      expect(result).toBe(`${MultichainNetwork.Solana}/token:${address}`);
      expect(CaipAssetTypeStruct.validate(result)).toStrictEqual([
        undefined,
        result,
      ]);
    });

    it('should create EVM token asset ID correctly', () => {
      const address = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';
      const chainId = 'eip155:1' as CaipChainId;

      const result = toAssetId(address, chainId);
      expect(result).toBe(`eip155:1/erc20:${address}`);
      expect(CaipAssetTypeStruct.validate(result)).toStrictEqual([
        undefined,
        result,
      ]);
    });

    it('should return undefined for non-hex address on EVM chains', () => {
      const address = 'not-a-hex-address';
      const chainId = 'eip155:1' as CaipChainId;

      const result = toAssetId(address, chainId);
      expect(result).toBeUndefined();
    });

    it('should handle different EVM chain IDs', () => {
      const address = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';
      const chainId = 'eip155:137' as CaipChainId;

      const result = toAssetId(address, chainId);
      expect(result).toBe(`eip155:137/erc20:${address}`);
      expect(CaipAssetTypeStruct.validate(result)).toStrictEqual([
        undefined,
        result,
      ]);
    });

    it('should handle checksummed addresses', () => {
      const address = '0x1F9840a85d5aF5bf1D1762F925BDADdC4201F984';
      const chainId = 'eip155:1' as CaipChainId;

      const result = toAssetId(address, chainId);
      expect(result).toBe(`eip155:1/erc20:${address}`);
      expect(CaipAssetTypeStruct.validate(result)).toStrictEqual([
        undefined,
        result,
      ]);
    });
  });

  describe('getAssetImageUrl', () => {
    it('should return correct image URL for a CAIP asset ID', () => {
      const assetId = 'eip155:1/erc20:0x123' as CaipAssetType;
      const expectedUrl = `${STATIC_METAMASK_BASE_URL}/api/v2/tokenIcons/assets/eip155/1/erc20/0x123.png`;

      expect(getAssetImageUrl(assetId, 'eip155:1')).toBe(expectedUrl);
    });

    it('should return correct image URL for non-hex CAIP asset ID', () => {
      const assetId =
        `${MultichainNetworks.SOLANA}/token:aBCD` as CaipAssetType;
      const expectedUrl = `${STATIC_METAMASK_BASE_URL}/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/aBCD.png`;

      expect(getAssetImageUrl(assetId, 'eip155:1')).toBe(expectedUrl);
    });

    it('should handle asset IDs with multiple colons', () => {
      const assetId = 'test:chain:1/token:0x123' as CaipAssetType;

      expect(getAssetImageUrl(assetId, 'eip155:1')).toBe(undefined);
    });
  });

  describe('fetchAssetMetadata', () => {
    const mockAddress = '0x123' as Hex;
    const mockChainId = 'eip155:1' as CaipChainId;
    const mockHexChainId = '0x1' as Hex;
    const mockAssetId = 'eip155:1/erc20:0x123' as CaipAssetType;

    beforeEach(() => {
      jest.clearAllMocks();
      (toEvmCaipChainId as jest.Mock).mockReturnValue(mockChainId);
      (toHex as jest.Mock).mockImplementation((val) => val as Hex);
    });

    it('should fetch EVM token metadata successfully', async () => {
      const mockMetadata = {
        assetId: mockAssetId,
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 18,
      };

      (fetchWithCache as jest.Mock).mockResolvedValueOnce([mockMetadata]);

      const result = await fetchAssetMetadata(mockAddress, mockHexChainId);

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: `${TOKEN_API_V3_BASE_URL}/assets?assetIds=${mockAssetId}`,
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
        },
        cacheOptions: {
          cacheRefreshTime: MINUTE,
        },
        functionName: 'fetchAssetMetadata',
      });

      expect(result).toStrictEqual({
        symbol: 'TEST',
        decimals: 18,
        image:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x123.png',
        assetId: mockAssetId,
        address: mockAddress,
        chainId: mockHexChainId,
      });
    });

    it('should fetch Solana token metadata successfully', async () => {
      const solanaChainId = MultichainNetwork.Solana;
      const solanaAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const solanaAssetId = `${solanaChainId}/token:${solanaAddress}`;

      const mockMetadata = {
        assetId: solanaAssetId,
        symbol: 'SOL',
        name: 'Solana Token',
        decimals: 9,
      };

      (fetchWithCache as jest.Mock).mockResolvedValueOnce([mockMetadata]);

      const result = await fetchAssetMetadata(solanaAddress, solanaChainId);

      expect(result).toStrictEqual({
        symbol: 'SOL',
        decimals: 9,
        image:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
        assetId: solanaAssetId,
        address: solanaAddress,
        chainId: solanaChainId,
      });
    });

    it('should handle CAIP chain IDs', async () => {
      const mockMetadata = {
        assetId: mockAssetId,
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 18,
      };

      (fetchWithCache as jest.Mock).mockResolvedValueOnce([mockMetadata]);

      const result = await fetchAssetMetadata(mockAddress, mockChainId);

      expect(toEvmCaipChainId).not.toHaveBeenCalled();

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: `${TOKEN_API_V3_BASE_URL}/assets?assetIds=${mockAssetId}`,
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
        },
        cacheOptions: {
          cacheRefreshTime: MINUTE,
        },
        functionName: 'fetchAssetMetadata',
      });

      expect(result).toStrictEqual({
        symbol: 'TEST',
        decimals: 18,
        image:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x123.png',
        assetId: mockAssetId,
        address: mockAddress,
        chainId: mockHexChainId,
      });
    });

    it('should handle hex chain IDs', async () => {
      const mockMetadata = {
        assetId: mockAssetId,
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 18,
      };

      (fetchWithCache as jest.Mock).mockResolvedValueOnce([mockMetadata]);

      const result = await fetchAssetMetadata(mockAddress, mockHexChainId);

      expect(toEvmCaipChainId).toHaveBeenCalledWith(mockHexChainId);

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: `${TOKEN_API_V3_BASE_URL}/assets?assetIds=${mockAssetId}`,
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
        },
        cacheOptions: {
          cacheRefreshTime: MINUTE,
        },
        functionName: 'fetchAssetMetadata',
      });

      expect(result).toStrictEqual({
        symbol: 'TEST',
        decimals: 18,
        image:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x123.png',
        assetId: mockAssetId,
        address: mockAddress,
        chainId: mockHexChainId,
      });
    });

    it('should return undefined when API call fails', async () => {
      (fetchWithCache as jest.Mock).mockRejectedValueOnce(
        new Error('API Error'),
      );

      const result = await fetchAssetMetadata(mockAddress, mockHexChainId);

      expect(result).toBeUndefined();
    });

    it('should return undefined when metadata processing fails', async () => {
      (fetchWithCache as jest.Mock).mockResolvedValueOnce([null]);

      const result = await fetchAssetMetadata(mockAddress, mockHexChainId);

      expect(result).toBeUndefined();
    });

    it('should return undefined when EVM address is not valid', async () => {
      const mockMetadata = {
        assetId: 'hjk',
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 18,
      };

      (fetchWithCache as jest.Mock).mockResolvedValueOnce([mockMetadata]);

      const result = await fetchAssetMetadata(mockAddress, mockHexChainId);

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: `${TOKEN_API_V3_BASE_URL}/assets?assetIds=${mockAssetId}`,
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
        },
        cacheOptions: {
          cacheRefreshTime: MINUTE,
        },
        functionName: 'fetchAssetMetadata',
      });

      expect(result).toStrictEqual({
        symbol: 'TEST',
        decimals: 18,
        image:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x123.png',
        assetId: mockAssetId,
        address: mockAddress,
        chainId: mockHexChainId,
      });
    });
  });
});
