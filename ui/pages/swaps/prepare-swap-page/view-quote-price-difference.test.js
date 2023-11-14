import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import { GasRecommendations } from '../../../../shared/constants/gas';
import ViewQuotePriceDifference from './view-quote-price-difference';

describe('View Price Quote Difference', () => {
  const mockState = {
    metamask: {
      tokens: [],
      providerConfig: {
        type: NETWORK_TYPES.RPC,
        nickname: '',
        rpcUrl: '',
        ticker: 'ETH',
      },
      preferences: { showFiatInTestnets: true },
      currentCurrency: 'usd',
      currencyRates: {
        ETH: {
          conversionRate: 600.0,
        },
      },
    },
  };

  const mockStore = configureMockStore()(mockState);

  // Sample transaction is 1 ETH to ~42.880915 LINK.
  const DEFAULT_PROPS = {
    usedQuote: {
      trade: {
        data: '0x5f575529000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000007756e69737761700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca0000000000000000000000000000000000000000000000000dc1a09f859b20000000000000000000000000000000000000000000000000024855454cb32d335f0000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000005fc7b7100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f161421c8e0000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca',
        from: '0xd7440fdcb70a9fba55dfe06942ddbc17679c90ac',
        value: '0xde0b6b3a7640000',
        gas: '0xbbfd0',
        to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
      },
      sourceAmount: '1000000000000000000',
      destinationAmount: '42947749216634160067',
      error: null,
      sourceToken: '0x0000000000000000000000000000000000000000',
      destinationToken: '0x514910771af9ca656af840dff83e8264ecf986ca',
      approvalNeeded: null,
      maxGas: 770000,
      averageGas: 210546,
      estimatedRefund: 80000,
      fetchTime: 647,
      aggregator: 'uniswap',
      aggType: 'DEX',
      fee: 0.875,
      gasMultiplier: 1.5,
      priceSlippage: {
        ratio: 1.007876641534847,
        calculationError: '',
        bucket: GasRecommendations.low,
        sourceAmountInETH: 1,
        destinationAmountInETH: 0.9921849150875727,
      },
      slippage: 2,
      sourceTokenInfo: {
        symbol: 'ETH',
        name: 'Ether',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        iconUrl: 'images/black-eth-logo.svg',
      },
      destinationTokenInfo: {
        address: '0x514910771af9ca656af840dff83e8264ecf986ca',
        symbol: 'LINK',
        decimals: 18,
        occurances: 12,
        iconUrl:
          'https://cloudflare-ipfs.com/ipfs/QmQhZAdcZvW9T2tPm516yHqbGkfhyZwTZmLixW9MXJudTA',
      },
      ethFee: '0.011791',
      ethValueOfTokens: '0.99220724791716534441',
      overallValueOfQuote: '0.98041624791716534441',
      metaMaskFeeInEth: '0.00875844985551091729',
      isBestQuote: true,
      savings: {
        performance: '0.00207907025112527799',
        fee: '0.005581',
        metaMaskFee: '0.00875844985551091729',
        total: '-0.0010983796043856393',
        medianMetaMaskFee: '0.00874009740688812165',
      },
    },
    sourceTokenValue: '1',
    destinationTokenValue: '42.947749',
  };

  it('displays an error when in low bucket', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <ViewQuotePriceDifference {...DEFAULT_PROPS} />,
      mockStore,
    );
    expect(getByTestId('mm-banner-alert')).toHaveClass(
      'mm-banner-alert--severity-warning',
    );
    expect(
      getByText('You are about to swap 1 ETH (~) for 42.947749 LINK (~).'),
    ).toBeInTheDocument();
    expect(getByText('Swap anyway')).toBeInTheDocument();
  });

  it('displays an error when in medium bucket', () => {
    const props = { ...DEFAULT_PROPS };
    props.usedQuote.priceSlippage.bucket = GasRecommendations.medium;
    const { getByText, getByTestId } = renderWithProvider(
      <ViewQuotePriceDifference {...props} />,
      mockStore,
    );
    expect(getByTestId('mm-banner-alert')).toHaveClass(
      'mm-banner-alert--severity-warning',
    );
    expect(
      getByText('You are about to swap 1 ETH (~) for 42.947749 LINK (~).'),
    ).toBeInTheDocument();
    expect(getByText('Swap anyway')).toBeInTheDocument();
  });

  it('displays an error when in high bucket', () => {
    const props = { ...DEFAULT_PROPS };
    props.usedQuote.priceSlippage.bucket = GasRecommendations.high;
    const { getByText, getByTestId } = renderWithProvider(
      <ViewQuotePriceDifference {...props} />,
      mockStore,
    );
    expect(getByTestId('mm-banner-alert')).toHaveClass(
      'mm-banner-alert--severity-danger',
    );
    expect(
      getByText('You are about to swap 1 ETH (~) for 42.947749 LINK (~).'),
    ).toBeInTheDocument();
    expect(getByText('Swap anyway')).toBeInTheDocument();
  });

  it('displays a fiat error when calculationError is present', () => {
    const props = { ...DEFAULT_PROPS, priceSlippageUnknownFiatValue: true };
    props.usedQuote.priceSlippage.calculationError =
      'Could not determine price.';
    const { getByText, getByTestId } = renderWithProvider(
      <ViewQuotePriceDifference {...props} />,
      mockStore,
    );
    expect(getByTestId('mm-banner-alert')).toHaveClass(
      'mm-banner-alert--severity-danger',
    );
    expect(getByText('Check your rate before proceeding')).toBeInTheDocument();
    expect(
      getByText(
        'Price impact could not be determined due to lack of market price data. Please confirm that you are comfortable with the amount of tokens you are about to receive before swapping.',
      ),
    ).toBeInTheDocument();
    expect(getByText('Swap anyway')).toBeInTheDocument();
  });
});
