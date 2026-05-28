import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import {
  QuoteResponse,
  RequestStatus,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import { setBackgroundConnection } from '../../../store/background-connection';
import { BridgeVipFeeMessage } from './bridge-vip-fee-message';

const mockGetVipTierForAccount = jest.fn();
setBackgroundConnection({
  rewardsGetVipTierForAccount: async (...args: unknown[]) =>
    mockGetVipTierForAccount(...args),
} as never);

const createDiscountedQuotes = (): QuoteResponse[] =>
  (mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[]).map((quote) => ({
    ...quote,
    quote: {
      ...quote.quote,
      feeData: {
        ...quote.quote.feeData,
        metabridge: {
          ...quote.quote.feeData.metabridge,
          amount: '1000000000000000000',
          quoteBpsFee: 50,
          baseBpsFee: 87.5,
        },
      },
    },
  }));

const createBridgeStoreWithQuotes = (
  quotes: QuoteResponse[],
  bridgeStateOverrides: Record<string, unknown> = {},
) =>
  createBridgeMockStore({
    featureFlagOverrides: {
      bridgeConfig: {
        maxRefreshCount: 5,
        refreshRate: 30000,
        chainRanking: [
          { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
          { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
          { chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON) },
        ],
      },
    },
    bridgeSliceOverrides: {
      toToken: {
        address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
        assetId: `${formatChainIdToCaip(CHAIN_IDS.POLYGON)}/erc20:${toChecksumHexAddress(
          '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        )}`,
      },
      fromTokenInputValue: '1',
    },
    bridgeStateOverrides: {
      quoteRequest: {
        insufficientBal: false,
        srcChainId: 10,
        destChainId: 137,
        srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        srcTokenAmount: '14000000',
      },
      quotesRefreshCount: 1,
      quotes,
      quotesLastFetched: Date.now(),
      quotesLoadingStatus: RequestStatus.FETCHED,
      ...bridgeStateOverrides,
    },
    metamaskStateOverrides: {
      marketData: {
        '0xa': {
          '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
            currency: 'usd',
            price: 1,
          },
        },
        '0x89': {
          '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
            currency: 'usd',
            price: 0.99,
          },
        },
      },
      currencyRates: {
        ETH: {
          conversionRate: 2524.25,
        },
        POL: {
          conversionRate: 1,
          usdConversionRate: 1,
        },
      },
      ...mockNetworkState(
        { chainId: CHAIN_IDS.OPTIMISM },
        { chainId: CHAIN_IDS.POLYGON },
      ),
    },
  });

describe('BridgeVipFeeMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVipTierForAccount.mockResolvedValue(5);
  });

  it('renders null when the active quote is not discounted', () => {
    const { container } = renderWithProvider(
      <BridgeVipFeeMessage />,
      configureStore(
        createBridgeStoreWithQuotes(
          mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
        ),
      ),
    );

    expect(container).toBeEmptyDOMElement();
    expect(mockGetVipTierForAccount).not.toHaveBeenCalled();
  });

  it('renders null when there is no active quote', () => {
    const { container } = renderWithProvider(
      <BridgeVipFeeMessage />,
      configureStore(createBridgeStoreWithQuotes([])),
    );

    expect(container).toBeEmptyDOMElement();
    expect(mockGetVipTierForAccount).not.toHaveBeenCalled();
  });

  it('renders null when the quote is expired', () => {
    const { container } = renderWithProvider(
      <BridgeVipFeeMessage />,
      configureStore(
        createBridgeStoreWithQuotes(createDiscountedQuotes(), {
          quotesRefreshCount: 5,
          quotesLastFetched: Date.now() - 60000,
        }),
      ),
    );

    expect(container).toBeEmptyDOMElement();
    expect(mockGetVipTierForAccount).not.toHaveBeenCalled();
  });

  it('renders discounted fee copy and VIP badge when a VIP discount applies', async () => {
    const store = createBridgeStoreWithQuotes(createDiscountedQuotes());
    store.metamask.remoteFeatureFlags.vipProgramEnabled = {
      enabled: true,
      minimumVersion: '0.0.0',
    };
    renderWithProvider(<BridgeVipFeeMessage />, configureStore(store));

    expect(screen.getByText(messages.includes.message)).toBeInTheDocument();
    expect(
      screen.getByText(messages.percent.message.replace('$1', '0.875')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.mmFee.message.replace('$1', '0.5')),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('rewards-vip-badge')).toBeInTheDocument();
      expect(screen.getByText('VIP 5')).toBeInTheDocument();
    });
    expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
  });

  it('renders fee copy without VIP badge when tier fetch returns null', async () => {
    mockGetVipTierForAccount.mockResolvedValueOnce(null);

    const store = createBridgeStoreWithQuotes(createDiscountedQuotes());
    store.metamask.remoteFeatureFlags.vipProgramEnabled = {
      enabled: true,
      minimumVersion: '0.0.0',
    };
    renderWithProvider(<BridgeVipFeeMessage />, configureStore(store));

    expect(screen.getByText(messages.includes.message)).toBeInTheDocument();
    expect(
      screen.getByText(messages.percent.message.replace('$1', '0.875')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.mmFee.message.replace('$1', '0.5')),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByTestId('rewards-vip-badge')).not.toBeInTheDocument();
  });
});
