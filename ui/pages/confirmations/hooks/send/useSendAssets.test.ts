import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { type Asset } from '../../types/send';
import { useSendAssets } from './useSendAssets';
import * as useSendTokensModule from './useSendTokens';
import * as useSendNftsModule from './useSendNfts';

jest.mock('./useSendTokens');
jest.mock('./useSendNfts');

const mockUseSendTokens = jest.spyOn(useSendTokensModule, 'useSendTokens');
const mockUseSendNfts = jest.spyOn(useSendNftsModule, 'useSendNfts');

describe('useSendAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tokens and nfts from respective hooks', () => {
    const mockTokens: Asset[] = [
      { id: 'token1', name: 'Token 1' } as Asset,
      { id: 'token2', name: 'Token 2' } as Asset,
    ];

    const mockNfts: Asset[] = [
      { id: 'nft1', name: 'NFT 1' } as Asset,
      { id: 'nft2', name: 'NFT 2' } as Asset,
    ];

    mockUseSendTokens.mockReturnValue(mockTokens);
    mockUseSendNfts.mockReturnValue(mockNfts);

    const { result } = renderHookWithProvider(() => useSendAssets(), mockState);

    expect(result.current).toEqual({
      tokens: mockTokens,
      nfts: mockNfts,
    });
  });

  it('returns empty arrays when hooks return empty arrays', () => {
    mockUseSendTokens.mockReturnValue([]);
    mockUseSendNfts.mockReturnValue([]);

    const { result } = renderHookWithProvider(() => useSendAssets(), mockState);

    expect(result.current).toEqual({
      tokens: [],
      nfts: [],
    });
  });

  it('calls both useSendTokens and useSendNfts hooks', () => {
    mockUseSendTokens.mockReturnValue([]);
    mockUseSendNfts.mockReturnValue([]);

    renderHookWithProvider(() => useSendAssets(), mockState);

    expect(mockUseSendTokens).toHaveBeenCalledTimes(1);
    expect(mockUseSendNfts).toHaveBeenCalledTimes(1);
  });
});
