import React from 'react';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteResponse, RequestStatus } from '@metamask/bridge-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import configureStore from '../../../store/store';
import * as bridgeActions from '../../../ducks/bridge/actions';
import { setBackgroundConnection } from '../../../store/background-connection';
import { BridgeQuotesModal } from './bridge-quotes-modal';

setBackgroundConnection({
  trackUnifiedSwapBridgeEvent: jest.fn(),
  getStatePatches: jest.fn(),
} as never);

describe('BridgeQuotesModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            '0x1': { isActiveSrc: true, isActiveDest: false },
            '0xa': { isActiveSrc: true, isActiveDest: false },
            '0x89': { isActiveSrc: false, isActiveDest: true },
          },
        },
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
        quoteRequest: {
          srcChainId: 10,
          destChainId: 137,
          srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          destTokenAddress: toChecksumHexAddress(
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          ),
          srcTokenAmount: '14000000',
        },
      },
      metamaskStateOverrides: {
        marketData: {
          '0xa': {
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
              currency: 'ETH',
              price: 1,
            },
          },
          '0x89': {
            [toChecksumHexAddress(
              '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            )]: {
              currency: 'POL',
              price: 0.99,
            },
          },
        },
        currencyRates: {
          ETH: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
          POL: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        ...mockNetworkState(
          { chainId: CHAIN_IDS.OPTIMISM },
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.LINEA_MAINNET },
          { chainId: CHAIN_IDS.POLYGON },
        ),
      },
    });

    const mockTrackMetaMetricsEvent = jest.spyOn(
      bridgeActions,
      'trackUnifiedSwapBridgeEvent',
    );

    const { baseElement, findByText } = renderWithProvider(
      <BridgeQuotesModal
        isOpen={true}
        onClose={() => {
          console.log('close');
        }}
      />,
      configureStore(mockStore),
    );

    expect(baseElement).toMatchSnapshot();
    await act(async () => {
      const acrossQuote = await findByText('Across');
      await userEvent.click(acrossQuote);
    });

    await waitFor(() => {
      expect(mockTrackMetaMetricsEvent.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "Unified SwapBridge Quote Selected",
            {
              "best_quote_provider": "socket_across",
              "can_submit": true,
              "gas_included": false,
              "gas_included_7702": false,
              "is_best_quote": true,
              "price_impact": 0,
              "provider": "socket_across",
              "quoted_time_minutes": 1,
              "usd_quoted_gas": 6.442841952e-8,
              "usd_quoted_return": 13.8444372,
            },
          ],
        ]
      `);
    });
  });

  it('should render the modal when exchange rates are not available', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            '0x1': { isActiveSrc: true, isActiveDest: false },
            '0xa': { isActiveSrc: true, isActiveDest: false },
            '0x89': { isActiveSrc: false, isActiveDest: true },
          },
        },
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
        quoteRequest: {
          srcChainId: 10,
          destChainId: 137,
          srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          destTokenAddress: toChecksumHexAddress(
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          ),
          srcTokenAmount: '14000000',
        },
      },
      metamaskStateOverrides: {
        currencyRates: {
          ETH: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
          POL: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        ...mockNetworkState(
          { chainId: CHAIN_IDS.OPTIMISM },
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.LINEA_MAINNET },
          { chainId: CHAIN_IDS.POLYGON },
        ),
      },
    });

    const { baseElement } = renderWithProvider(
      <BridgeQuotesModal
        isOpen={true}
        onClose={() => {
          console.log('close');
        }}
      />,
      configureStore(mockStore),
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should render gasIncluded quotes', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            '0x1': { isActiveSrc: true, isActiveDest: false },
            '0xa': { isActiveSrc: true, isActiveDest: false },
            '0x89': { isActiveSrc: false, isActiveDest: true },
          },
        },
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesErc20Erc20.map(
          (quote) =>
            ({
              ...quote,
              quote: {
                ...quote.quote,
                gasIncluded: true,
                feeData: {
                  ...quote.quote.feeData,
                  txFee: {
                    amount: '9999900',
                    asset: quote.quote.srcAsset,
                  },
                },
              },
            }) as unknown as QuoteResponse,
        ),
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
        quoteRequest: {
          srcChainId: 10,
          destChainId: 137,
          srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          destTokenAddress: toChecksumHexAddress(
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          ),
          srcTokenAmount: '14000000',
        },
      },
      metamaskStateOverrides: {
        marketData: {
          '0xa': {
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
              currency: 'ETH',
              price: 1,
            },
          },
          '0x89': {
            [toChecksumHexAddress(
              '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            )]: {
              currency: 'POL',
              price: 0.99,
            },
          },
        },
        currencyRates: {
          ETH: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
          POL: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        ...mockNetworkState(
          { chainId: CHAIN_IDS.OPTIMISM },
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.LINEA_MAINNET },
          { chainId: CHAIN_IDS.POLYGON },
        ),
      },
    });

    const { baseElement } = renderWithProvider(
      <BridgeQuotesModal
        isOpen={true}
        onClose={() => {
          console.log('close');
        }}
      />,
      configureStore(mockStore),
    );

    expect(baseElement).toMatchSnapshot();
  });
});
