import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { NETWORK_TYPE_RPC } from '../../../../../shared/constants/network';
import ViewQuotePriceDifference from './view-quote-price-difference';

describe('View Price Quote Difference', () => {
  const t = (key) => `translate ${key}`;

  const state = {
    metamask: {
      tokens: [],
      provider: { type: NETWORK_TYPE_RPC, nickname: '', rpcUrl: '' },
      preferences: { showFiatInTestnets: true },
      currentCurrency: 'usd',
      conversionRate: 600.0,
    },
  };

  const store = configureMockStore()(state);

  // Sample transaction is 1 $ETH to ~42.880915 $LINK
  const DEFAULT_PROPS = {
    usedQuote: {
      trade: {
        data:
          '0x5f575529000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000007756e69737761700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca0000000000000000000000000000000000000000000000000dc1a09f859b20000000000000000000000000000000000000000000000000024855454cb32d335f0000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000005fc7b7100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f161421c8e0000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca',
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
        bucket: 'low',
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

  let component;
  function renderComponent(props) {
    component = shallow(
      <Provider store={store}>
        <ViewQuotePriceDifference {...props} />
      </Provider>,
      {
        context: { t },
      },
    );
  }

  afterEach(() => {
    component.unmount();
  });

  it('does not render when there is no quote', () => {
    const props = { ...DEFAULT_PROPS, usedQuote: null };
    renderComponent(props);

    const wrappingDiv = component.find(
      '.view-quote__price-difference-warning-wrapper',
    );
    expect(wrappingDiv).toHaveLength(0);
  });

  it('does not render when the item is in the low bucket', () => {
    const props = { ...DEFAULT_PROPS };
    props.usedQuote.priceSlippage.bucket = 'low';

    renderComponent(props);
    const wrappingDiv = component.find(
      '.view-quote__price-difference-warning-wrapper',
    );
    expect(wrappingDiv).toHaveLength(0);
  });

  it('displays an error when in medium bucket', () => {
    const props = { ...DEFAULT_PROPS };
    props.usedQuote.priceSlippage.bucket = 'medium';

    renderComponent(props);
    expect(component.html()).toContain('medium');
  });

  it('displays an error when in high bucket', () => {
    const props = { ...DEFAULT_PROPS };
    props.usedQuote.priceSlippage.bucket = 'high';

    renderComponent(props);
    expect(component.html()).toContain('high');
  });

  it('displays a fiat error when calculationError is present', () => {
    const props = { ...DEFAULT_PROPS, priceSlippageUnknownFiatValue: true };
    props.usedQuote.priceSlippage.calculationError =
      'Could not determine price.';

    renderComponent(props);
    expect(component.html()).toContain('fiat-error');
  });
});
