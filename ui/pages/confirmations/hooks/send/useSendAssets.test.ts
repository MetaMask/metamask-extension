import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { type Asset } from '../../types/send';
import { useSendAssets } from './useSendAssets';
import * as useSendTokensModule from './useSendTokens';
import * as useSendNftsModule from './useSendNfts';

jest.mock('./useSendTokens');
jest.mock('./useSendNfts');

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

describe('useSendAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tokens and nfts from respective hooks', () => {
    const mockTokens: Asset[] = [
      { id: 'token1', name: 'Token 1', chainId: '0x1' } as Asset,
      { id: 'token2', name: 'Token 2', chainId: '0x1' } as Asset,
    ];

    const mockNfts: Asset[] = [
      { id: 'nft1', name: 'NFT 1' } as Asset,
      { id: 'nft2', name: 'NFT 2' } as Asset,
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

  it('filters out non-EVM tokens when BFT is OFF', () => {
    const mockTokens: Asset[] = [
      { id: 'token1', name: 'EVM Token', chainId: '0x1' } as Asset,
      {
        id: 'token2',
        name: 'Solana Token',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      } as Asset,
      { id: 'token3', name: 'Another EVM Token', chainId: '0x89' } as Asset,
    ];

    const mockNfts: Asset[] = [{ id: 'nft1', name: 'NFT 1' } as Asset];

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
    expect(result.current.nfts).toEqual(mockNfts);
  });
});
