import { useSelector } from 'react-redux';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { getAllEnabledNetworksForAllNamespaces } from '../../../../selectors/multichain/networks';
import { type Asset } from '../../types/send';
import { useSendAssets } from './useSendAssets';
import * as useSendTokensModule from './useSendTokens';
import * as useSendNftsModule from './useSendNfts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('./useSendTokens');
jest.mock('./useSendNfts');

const mockUseSelector = jest.mocked(useSelector);
const mockUseSendTokens = jest.spyOn(useSendTokensModule, 'useSendTokens');
const mockUseSendNfts = jest.spyOn(useSendNftsModule, 'useSendNfts');

// State with external services enabled (BFT ON)
const mockStateWithExternalServices = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    useExternalServices: true,
  },
};

// State with external services disabled (BFT OFF)
const mockStateWithoutExternalServices = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    useExternalServices: false,
  },
};

const mockEnabledNetworks = ['0x1', '0x89', '0xaa36a7'];

describe('useSendAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getAllEnabledNetworksForAllNamespaces) {
        return mockEnabledNetworks;
      }
      return undefined;
    });
  });

  it('returns tokens and nfts from respective hooks', () => {
    const mockTokens: Asset[] = [
      { id: 'token1', name: 'Token 1', chainId: '0x1' } as Asset,
      { id: 'token2', name: 'Token 2', chainId: '0x1' } as Asset,
    ];

    const mockNfts: Asset[] = [
      { id: 'nft1', name: 'NFT 1', chainId: '0x1' } as Asset,
      { id: 'nft2', name: 'NFT 2', chainId: '0x1' } as Asset,
    ];

    mockUseSendTokens.mockReturnValue(mockTokens);
    mockUseSendNfts.mockReturnValue(mockNfts);

    const { result } = renderHookWithProvider(
      () => useSendAssets(),
      mockStateWithExternalServices,
    );

    expect(result.current).toEqual({
      tokens: mockTokens,
      nfts: mockNfts,
    });
  });

  it('returns empty arrays when hooks return empty arrays', () => {
    mockUseSendTokens.mockReturnValue([]);
    mockUseSendNfts.mockReturnValue([]);

    const { result } = renderHookWithProvider(
      () => useSendAssets(),
      mockStateWithExternalServices,
    );

    expect(result.current).toEqual({
      tokens: [],
      nfts: [],
    });
  });

  it('calls both useSendTokens and useSendNfts hooks', () => {
    mockUseSendTokens.mockReturnValue([]);
    mockUseSendNfts.mockReturnValue([]);

    renderHookWithProvider(
      () => useSendAssets(),
      mockStateWithExternalServices,
    );

    expect(mockUseSendTokens).toHaveBeenCalledTimes(1);
    expect(mockUseSendNfts).toHaveBeenCalledTimes(1);
  });

  it('filters out non-EVM tokens and NFTs when BFT is OFF', () => {
    const mockTokens: Asset[] = [
      { id: 'token1', name: 'EVM Token', chainId: '0x1' } as Asset,
      {
        id: 'token2',
        name: 'Solana Token',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      } as Asset,
      { id: 'token3', name: 'Another EVM Token', chainId: '0x89' } as Asset,
    ];

    const mockNfts: Asset[] = [
      { id: 'nft1', name: 'EVM NFT', chainId: '0x1' } as Asset,
      {
        id: 'nft2',
        name: 'Solana NFT',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      } as Asset,
      { id: 'nft3', name: 'Another EVM NFT', chainId: '0x89' } as Asset,
    ];

    mockUseSendTokens.mockReturnValue(mockTokens);
    mockUseSendNfts.mockReturnValue(mockNfts);

    const { result } = renderHookWithProvider(
      () => useSendAssets(),
      mockStateWithoutExternalServices,
    );

    // Only EVM tokens should be returned
    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.tokens[0].chainId).toBe('0x1');
    expect(result.current.tokens[1].chainId).toBe('0x89');

    // Only EVM NFTs should be returned (non-EVM NFTs filtered out to prevent
    // their chain IDs from appearing in the network filter dropdown)
    expect(result.current.nfts).toHaveLength(2);
    expect(result.current.nfts[0].chainId).toBe('0x1');
    expect(result.current.nfts[1].chainId).toBe('0x89');
  });

  it('filters out tokens from networks not in Network Manager', () => {
    const mockTokens: Asset[] = [
      { id: 'token1', name: 'Token 1', chainId: '0x1' } as Asset,
      { id: 'token2', name: 'Token 2', chainId: '0x89' } as Asset,
      { id: 'token3', name: 'Token 3', chainId: '0x999' } as Asset, // Not in enabled networks
    ];

    const mockNfts: Asset[] = [
      { id: 'nft1', name: 'NFT 1', chainId: '0x1' } as Asset,
      { id: 'nft2', name: 'NFT 2', chainId: '0x999' } as Asset, // Not in enabled networks
    ];

    mockUseSendTokens.mockReturnValue(mockTokens);
    mockUseSendNfts.mockReturnValue(mockNfts);

    const { result } = renderHookWithProvider(
      () => useSendAssets(),
      mockStateWithExternalServices,
    );

    // Only tokens from enabled networks should be returned
    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.tokens[0].chainId).toBe('0x1');
    expect(result.current.tokens[1].chainId).toBe('0x89');

    // Only NFTs from enabled networks should be returned
    expect(result.current.nfts).toHaveLength(1);
    expect(result.current.nfts[0].chainId).toBe('0x1');
  });

  it('filters out NFTs with undefined chainId', () => {
    const mockTokens: Asset[] = [
      { id: 'token1', name: 'Token 1', chainId: '0x1' } as Asset,
    ];

    const mockNfts: Asset[] = [
      { id: 'nft1', name: 'NFT 1', chainId: '0x1' } as Asset,
      { id: 'nft2', name: 'NFT 2', chainId: undefined } as Asset,
    ];

    mockUseSendTokens.mockReturnValue(mockTokens);
    mockUseSendNfts.mockReturnValue(mockNfts);

    const { result } = renderHookWithProvider(
      () => useSendAssets(),
      mockStateWithExternalServices,
    );

    // NFT with undefined chainId should be filtered out
    expect(result.current.nfts).toHaveLength(1);
    expect(result.current.nfts[0].chainId).toBe('0x1');
  });

  it('applies both enabledNetworks and EVM filtering when BFT is OFF', () => {
    const mockTokens: Asset[] = [
      { id: 'token1', name: 'EVM Token', chainId: '0x1' } as Asset,
      { id: 'token2', name: 'EVM Token 2', chainId: '0x89' } as Asset,
      {
        id: 'token3',
        name: 'Solana Token',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      } as Asset,
      { id: 'token4', name: 'Disabled Network Token', chainId: '0x999' } as Asset, // Not enabled
    ];

    const mockNfts: Asset[] = [
      { id: 'nft1', name: 'EVM NFT', chainId: '0x1' } as Asset,
      {
        id: 'nft2',
        name: 'Solana NFT',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      } as Asset,
      { id: 'nft3', name: 'Disabled Network NFT', chainId: '0x999' } as Asset, // Not enabled
    ];

    mockUseSendTokens.mockReturnValue(mockTokens);
    mockUseSendNfts.mockReturnValue(mockNfts);

    const { result } = renderHookWithProvider(
      () => useSendAssets(),
      mockStateWithoutExternalServices,
    );

    // Should filter out both non-EVM and non-enabled networks
    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.tokens[0].chainId).toBe('0x1');
    expect(result.current.tokens[1].chainId).toBe('0x89');

    expect(result.current.nfts).toHaveLength(1);
    expect(result.current.nfts[0].chainId).toBe('0x1');
  });
});
