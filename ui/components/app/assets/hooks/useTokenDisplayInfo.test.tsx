import { Hex } from '@metamask/utils';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import {
  useTokensData,
  type TokenAsset,
} from '../../../../hooks/useTokensData';
import { TokenWithFiatAmount } from '../types';
import { useTokenDisplayInfo } from './useTokenDisplayInfo';

jest.mock('../../../../hooks/useTokensData');
jest.mock('../../../../hooks/useMultichainSelector', () => ({
  useMultichainSelector: jest.fn().mockReturnValue(false),
}));
jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: jest.fn().mockReturnValue({
    formatCurrencyWithMinThreshold: jest.fn().mockReturnValue('$5.00'),
  }),
}));

const TOKEN_ADDRESS = '0xABCDEF1234567890ABcdef1234567890abCDEF12';
const CHAIN_ID = '0x1' as Hex;
const CAIP19_ASSET_ID = `eip155:1/erc20:${TOKEN_ADDRESS.toLowerCase()}`;

const BASE_TOKEN: Partial<TokenWithFiatAmount> = {
  address: TOKEN_ADDRESS,
  chainId: CHAIN_ID,
  isNative: false,
  decimals: 18,
  aggregators: [],
  balance: '1',
  string: '1.000',
  tokenFiatAmount: 5,
  symbol: 'TEST',
};

function buildState() {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      enabledNetworksByNamespace: { '0x1': true },
      showFiatInTestnets: false,
      currentCurrency: 'usd',
    },
  };
}

describe('useTokenDisplayInfo', () => {
  const useTokensDataMock = jest.mocked(useTokensData);

  beforeEach(() => {
    useTokensDataMock.mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fallbackAssetId trigger condition', () => {
    it('does NOT call useTokensData when both name and image are present', () => {
      const token = {
        ...BASE_TOKEN,
        name: 'Test Token',
        image: './images/test.svg',
      } as TokenWithFiatAmount;

      renderHookWithProvider(
        () => useTokenDisplayInfo({ token }),
        buildState(),
      );

      expect(useTokensDataMock).toHaveBeenCalledWith([]);
    });

    it('calls useTokensData when name is missing', () => {
      const token = {
        ...BASE_TOKEN,
        name: undefined,
        image: './images/test.svg',
      } as unknown as TokenWithFiatAmount;

      renderHookWithProvider(
        () => useTokenDisplayInfo({ token }),
        buildState(),
      );

      expect(useTokensDataMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining(TOKEN_ADDRESS.toLowerCase()),
        ]),
      );
    });

    it('calls useTokensData when image is missing even if name is present', () => {
      const token = {
        ...BASE_TOKEN,
        name: 'Test Token',
        image: '',
      } as TokenWithFiatAmount;

      renderHookWithProvider(
        () => useTokenDisplayInfo({ token }),
        buildState(),
      );

      expect(useTokensDataMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining(TOKEN_ADDRESS.toLowerCase()),
        ]),
      );
    });

    it('calls useTokensData when both name and image are missing', () => {
      const token = {
        ...BASE_TOKEN,
        name: undefined,
        image: '',
      } as unknown as TokenWithFiatAmount;

      renderHookWithProvider(
        () => useTokenDisplayInfo({ token }),
        buildState(),
      );

      expect(useTokensDataMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining(TOKEN_ADDRESS.toLowerCase()),
        ]),
      );
    });
  });

  describe('tokenImage resolution', () => {
    it('returns empty string (not undefined) when token.image is empty and API has not responded yet', () => {
      // useTokensData returns {} while the fetch is in-flight
      useTokensDataMock.mockReturnValue({});

      const token = {
        ...BASE_TOKEN,
        name: 'Test Token',
        image: '',
      } as TokenWithFiatAmount;

      const { result } = renderHookWithProvider(
        () => useTokenDisplayInfo({ token }),
        buildState(),
      );

      expect(result.current.tokenImage).toBe('');
    });

    it('uses token.image when present', () => {
      const token = {
        ...BASE_TOKEN,
        name: 'Test Token',
        image: './images/test.svg',
      } as TokenWithFiatAmount;

      const { result } = renderHookWithProvider(
        () => useTokenDisplayInfo({ token }),
        buildState(),
      );

      expect(result.current.tokenImage).toBe('./images/test.svg');
    });

    it('falls back to API iconUrl when token.image is empty but name is present', () => {
      const apiIconUrl = 'https://api.example.com/token.png';
      useTokensDataMock.mockReturnValue({
        [CAIP19_ASSET_ID]: {
          iconUrl: apiIconUrl,
          name: 'Test Token',
          symbol: 'TEST',
        } as TokenAsset,
      });

      const token = {
        ...BASE_TOKEN,
        name: 'Test Token',
        image: '',
      } as TokenWithFiatAmount;

      const { result } = renderHookWithProvider(
        () => useTokenDisplayInfo({ token }),
        buildState(),
      );

      expect(result.current.tokenImage).toBe(apiIconUrl);
    });

    it('falls back to API iconUrl when both token.name and token.image are absent', () => {
      const apiIconUrl = 'https://api.example.com/token.png';
      useTokensDataMock.mockReturnValue({
        [CAIP19_ASSET_ID]: {
          iconUrl: apiIconUrl,
          name: 'Test Token From API',
          symbol: 'TEST',
        } as TokenAsset,
      });

      const token = {
        ...BASE_TOKEN,
        name: undefined,
        image: '',
      } as unknown as TokenWithFiatAmount;

      const { result } = renderHookWithProvider(
        () => useTokenDisplayInfo({ token }),
        buildState(),
      );

      expect(result.current.tokenImage).toBe(apiIconUrl);
      expect(result.current.title).toBe('Test Token From API');
    });
  });
});
