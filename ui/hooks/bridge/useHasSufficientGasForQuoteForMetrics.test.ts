import {
  ChainId,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  type QuoteResponse,
} from '@metamask/bridge-controller';
import { KnownCaipNamespace } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import * as bridgeSelectors from '../../ducks/bridge/selectors';
import type { BridgeAssetV2 } from '../../pages/bridge/utils/tokens';
import { useHasSufficientGasForQuoteForMetrics } from './useHasSufficientGasForQuoteForMetrics';

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  selectMinimumBalanceForRentExemptionInSOL: jest.fn(),
}));

jest.mock('../../ducks/bridge/selectors', () => ({
  ...jest.requireActual('../../ducks/bridge/selectors'),
  getFromBalances: jest.fn(),
  getFromToken: jest.fn(),
  getQuoteRequest: jest.fn(),
}));

const mockGetFromBalances =
  bridgeSelectors.getFromBalances as unknown as jest.Mock;
const mockGetFromToken = bridgeSelectors.getFromToken as unknown as jest.Mock;
const mockGetQuoteRequest =
  bridgeSelectors.getQuoteRequest as unknown as jest.Mock;

const NATIVE_TOKEN = getNativeAssetForChainId(ChainId.ETH);
const ERC20_TOKEN = {
  symbol: 'USDC',
  name: 'USD Coin',
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  assetId:
    'eip155:10/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' as const,
  decimals: 6,
};

const buildQuote = (
  token: BridgeAssetV2,
  totalNetworkFee: string,
  sentAmount: string,
  srcChainId?: number | string,
) =>
  ({
    quote: {
      src: {
        asset: token,
        amount: new BigNumber(sentAmount)
          .mul(Math.pow(10, token.decimals))
          .toFixed(),
        normalizedAmount: sentAmount,
      },
      feeData: {
        network: [
          {
            amount: new BigNumber(totalNetworkFee)
              .mul(Math.pow(10, 18))
              .toFixed(),
            normalizedAmount: totalNetworkFee,
            asset: getNativeAssetForChainId(srcChainId ?? 1),
          },
        ],
      },
    },
    chainId: formatChainIdToCaip(srcChainId ?? 1),
    estimatedProcessingTimeInSeconds: 0,
    namespace: KnownCaipNamespace.Eip155,
  }) as unknown as QuoteResponse;

const renderUseHasSufficientGasForQuoteForMetrics = (
  store = createBridgeMockStore(),
) =>
  renderHookWithProvider(() => useHasSufficientGasForQuoteForMetrics(), store);

describe('useHasSufficientGasForQuoteForMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFromBalances.mockReturnValue({
      [getNativeAssetForChainId(ChainId.ETH).assetId]: '100',
    } as ReturnType<typeof bridgeSelectors.getFromBalances>);
    mockGetFromToken.mockReturnValue(NATIVE_TOKEN);
    mockGetQuoteRequest.mockReturnValue(undefined);
  });

  it('returns null when there is no quote', () => {
    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    expect(result.current(null)).toBeNull();
  });

  it('returns false when the native balance is missing', () => {
    mockGetFromBalances.mockReturnValue({});

    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    expect(
      result.current(buildQuote(NATIVE_TOKEN, '10', '80', ChainId.ETH)),
    ).toBe(false);
  });

  it('returns true for a native quote when the balance covers fee + sent amount', () => {
    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    expect(
      result.current(buildQuote(NATIVE_TOKEN, '10', '80', ChainId.ETH)),
    ).toBe(true);
  });

  it('returns false for a non-native quote when the balance is below the fee', () => {
    mockGetFromToken.mockReturnValue(ERC20_TOKEN);
    mockGetFromBalances.mockReturnValue({
      [getNativeAssetForChainId(ChainId.ETH).assetId]: '49',
    } as ReturnType<typeof bridgeSelectors.getFromBalances>);

    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    expect(
      result.current(buildQuote(ERC20_TOKEN, '50', '80', ChainId.ETH)),
    ).toBe(false);
  });

  it('applies the Solana rent reserve based on quoteRequest.srcChainId', () => {
    mockGetQuoteRequest.mockReturnValue({ srcChainId: ChainId.SOLANA });

    const { result } = renderUseHasSufficientGasForQuoteForMetrics(
      createBridgeMockStore({
        bridgeStateOverrides: {
          minimumBalanceForRentExemptionInLamports: '15000000000',
        },
      }),
    );

    // 100 - 10 - 80 - 15 <= 0 -> insufficient
    expect(result.current(buildQuote(NATIVE_TOKEN, '10', '80'))).toBe(false);
  });

  it('does not apply the reserve for a non-Solana chain even when one is configured', () => {
    mockGetQuoteRequest.mockReturnValue({ srcChainId: ChainId.ETH });

    const { result } = renderUseHasSufficientGasForQuoteForMetrics(
      createBridgeMockStore({
        bridgeStateOverrides: {
          minimumBalanceForRentExemptionInLamports: '15000000000',
        },
      }),
    );

    // reserve resolves to '0' -> 100 - 10 - 80 > 0 -> sufficient
    expect(result.current(buildQuote(NATIVE_TOKEN, '10', '80'))).toBe(true);
  });

  it('falls back to the quote srcChainId when there is no quote request', () => {
    mockGetQuoteRequest.mockReturnValue(undefined);

    const { result } = renderUseHasSufficientGasForQuoteForMetrics(
      createBridgeMockStore({
        bridgeStateOverrides: {
          minimumBalanceForRentExemptionInLamports: '15000000000',
        },
      }),
    );

    // quote.quote.srcChainId is Solana -> reserve applied -> insufficient
    expect(
      result.current(
        buildQuote(
          getNativeAssetForChainId(ChainId.SOLANA),
          '10',
          '80',
          ChainId.SOLANA,
        ),
      ),
    ).toBe(false);
  });

  it('returns a stable callback across rerenders when inputs are unchanged', () => {
    const { result, rerender } = renderUseHasSufficientGasForQuoteForMetrics();
    const firstCallback = result.current;

    rerender();

    expect(result.current).toBe(firstCallback);
  });
});
