import {
  type QuoteResponse,
  RequestStatus,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesNativeErc20 from '../../../test/data/bridge/mock-quotes-native-erc20.json';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import * as bridgeActions from '../../ducks/bridge/actions';
import { useIsTxSubmittable } from './useIsTxSubmittable';
import { useQuoteFetchEvents } from './useQuoteFetchEvents';

const mockDispatch = jest.fn((...args: unknown[]) => jest.fn()(...args));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch:
    () =>
    (...args: unknown[]) =>
      mockDispatch(...args),
}));

jest.mock('./useIsTxSubmittable', () => ({
  useIsTxSubmittable: jest.fn(() => true),
}));

const mockUseIsTxSubmittable = useIsTxSubmittable as jest.Mock;

const renderUseQuoteFetchEvents = (mockStoreState: object) =>
  renderHookWithProvider(() => useQuoteFetchEvents(), mockStoreState);

describe('useQuoteFetchEvents', () => {
  let trackEventSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    trackEventSpy = jest
      .spyOn(bridgeActions, 'trackUnifiedSwapBridgeEvent')
      .mockImplementation(
        (..._args: unknown[]) => (() => Promise.resolve()) as never,
      );
  });

  it('dispatches QuotesReceived when quotes finish loading with no error', () => {
    renderUseQuoteFetchEvents(
      createBridgeMockStore({
        bridgeStateOverrides: {
          quotesRefreshCount: 1,
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
        },
      }),
    );

    expect(trackEventSpy).toHaveBeenCalledTimes(1);
    expect(trackEventSpy).toHaveBeenCalledWith(
      UnifiedSwapBridgeEventName.QuotesReceived,
      expect.any(Object),
    );
  });

  it('does not dispatch QuotesReceived when still loading', () => {
    renderUseQuoteFetchEvents(
      createBridgeMockStore({
        bridgeStateOverrides: {
          quotesRefreshCount: 1,
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.LOADING,
        },
      }),
    );

    expect(trackEventSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch QuotesReceived when quotesRefreshCount is 0', () => {
    renderUseQuoteFetchEvents(
      createBridgeMockStore({
        bridgeStateOverrides: {
          quotesRefreshCount: 0,
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
        },
      }),
    );

    expect(trackEventSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch QuotesReceived when there is a fetch error', () => {
    renderUseQuoteFetchEvents(
      createBridgeMockStore({
        bridgeStateOverrides: {
          quotesRefreshCount: 1,
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: 'Network error',
        },
      }),
    );

    expect(trackEventSpy).not.toHaveBeenCalled();
  });

  it('passes null when activeQuote is undefined (no quotes available)', () => {
    mockUseIsTxSubmittable.mockReturnValue(false);

    renderUseQuoteFetchEvents(
      createBridgeMockStore({
        bridgeStateOverrides: {
          quotesRefreshCount: 1,
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: [],
        },
      }),
    );

    expect(trackEventSpy).toHaveBeenCalledTimes(1);
    expect(trackEventSpy).toHaveBeenCalledWith(
      UnifiedSwapBridgeEventName.QuotesReceived,
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        can_submit: false,
        provider: '_',
      }),
    );
  });

  it('includes quote provider when activeQuote exists', () => {
    renderUseQuoteFetchEvents(
      createBridgeMockStore({
        bridgeStateOverrides: {
          quotesRefreshCount: 1,
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        },
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          currencyRates: {
            ETH: { conversionRate: 2500, usdConversionRate: 2500 },
          },
        },
      }),
    );

    expect(trackEventSpy).toHaveBeenCalledTimes(1);
    expect(trackEventSpy).toHaveBeenCalledWith(
      UnifiedSwapBridgeEventName.QuotesReceived,
      expect.objectContaining({
        provider: expect.stringMatching(/.+_.+/u),
      }),
    );
  });
});
