import {
  ChainId,
  selectMinimumBalanceForRentExemptionInSOL,
  type QuoteMetadata,
  type QuoteResponse,
} from '@metamask/bridge-controller';
import { zeroAddress } from 'ethereumjs-util';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import * as bridgeSelectors from '../../ducks/bridge/selectors';
import { useHasSufficientGasForQuoteForMetrics } from './useHasSufficientGasForQuoteForMetrics';

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  selectMinimumBalanceForRentExemptionInSOL: jest.fn(),
}));

jest.mock('../../ducks/bridge/selectors', () => ({
  ...jest.requireActual('../../ducks/bridge/selectors'),
  getFromNativeBalance: jest.fn(),
  getFromToken: jest.fn(),
  getQuoteRequest: jest.fn(),
}));

const mockGetFromNativeBalance =
  bridgeSelectors.getFromNativeBalance as unknown as jest.Mock;
const mockGetFromToken = bridgeSelectors.getFromToken as unknown as jest.Mock;
const mockGetQuoteRequest =
  bridgeSelectors.getQuoteRequest as unknown as jest.Mock;
const mockSelectMinReserve =
  selectMinimumBalanceForRentExemptionInSOL as unknown as jest.Mock;

const NATIVE_TOKEN = { assetId: zeroAddress() };
const ERC20_TOKEN = {
  assetId: '0x6b175474e89094c44da98b954eedeac495271d0f',
};

const buildQuote = (
  totalNetworkFee: string,
  sentAmount: string,
  srcChainId?: number | string,
) =>
  ({
    quote: { srcChainId },
    totalNetworkFee: { amount: totalNetworkFee },
    sentAmount: { amount: sentAmount },
  }) as unknown as QuoteResponse & QuoteMetadata;

const renderUseHasSufficientGasForQuoteForMetrics = () =>
  renderHookWithProvider(
    () => useHasSufficientGasForQuoteForMetrics(),
    createBridgeMockStore(),
  );

describe('useHasSufficientGasForQuoteForMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFromNativeBalance.mockReturnValue('100');
    mockGetFromToken.mockReturnValue(NATIVE_TOKEN);
    mockGetQuoteRequest.mockReturnValue(undefined);
    mockSelectMinReserve.mockReturnValue('0');
  });

  it('returns null when there is no quote', () => {
    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    expect(result.current(null)).toBeNull();
  });

  it('returns null when the native balance is missing', () => {
    mockGetFromNativeBalance.mockReturnValue(null);

    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    expect(result.current(buildQuote('10', '80', ChainId.ETH))).toBeNull();
  });

  it('returns true for a native quote when the balance covers fee + sent amount', () => {
    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    expect(result.current(buildQuote('10', '80', ChainId.ETH))).toBe(true);
  });

  it('returns false for a non-native quote when the balance is at or below the fee', () => {
    mockGetFromToken.mockReturnValue(ERC20_TOKEN);
    mockGetFromNativeBalance.mockReturnValue('50');

    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    expect(result.current(buildQuote('50', '80', ChainId.ETH))).toBe(false);
  });

  it('applies the Solana rent reserve based on quoteRequest.srcChainId', () => {
    mockGetQuoteRequest.mockReturnValue({ srcChainId: ChainId.SOLANA });
    mockSelectMinReserve.mockReturnValue('15');

    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    // 100 - 10 - 80 - 15 <= 0 -> insufficient
    expect(result.current(buildQuote('10', '80'))).toBe(false);
  });

  it('does not apply the reserve for a non-Solana chain even when one is configured', () => {
    mockGetQuoteRequest.mockReturnValue({ srcChainId: ChainId.ETH });
    mockSelectMinReserve.mockReturnValue('15');

    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    // reserve resolves to '0' -> 100 - 10 - 80 > 0 -> sufficient
    expect(result.current(buildQuote('10', '80'))).toBe(true);
  });

  it('falls back to the quote srcChainId when there is no quote request', () => {
    mockGetQuoteRequest.mockReturnValue(undefined);
    mockSelectMinReserve.mockReturnValue('15');

    const { result } = renderUseHasSufficientGasForQuoteForMetrics();

    // quote.quote.srcChainId is Solana -> reserve applied -> insufficient
    expect(result.current(buildQuote('10', '80', ChainId.SOLANA))).toBe(false);
  });

  it('returns a stable callback across rerenders when inputs are unchanged', () => {
    const { result, rerender } = renderUseHasSufficientGasForQuoteForMetrics();
    const firstCallback = result.current;

    rerender();

    expect(result.current).toBe(firstCallback);
  });
});
