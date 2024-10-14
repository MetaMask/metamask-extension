import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { NetworkType } from '@metamask/controller-utils';
import { act } from '@testing-library/react';
import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getSwap1559GasFeeEstimates } from '../swaps.util';
import ReviewQuote from './review-quote';

jest.mock(
  '../../../components/ui/info-tooltip/info-tooltip-icon',
  () => () => '<InfoTooltipIcon />',
);

jest.mock('../swaps.util', () => ({
  ...jest.requireActual('../swaps.util'),
  getSwap1559GasFeeEstimates: jest.fn(),
}));

const middleware = [thunk];
const createProps = (customProps = {}) => {
  return {
    setReceiveToAmount: jest.fn(),
    ...customProps,
  };
};

describe('ReviewQuote', () => {
  const getSwap1559GasFeeEstimatesMock = jest.mocked(
    getSwap1559GasFeeEstimates,
  );

  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(<ReviewQuote {...props} />, store);
    expect(getByText('New quotes in')).toBeInTheDocument();
    expect(getByText('Quote rate*')).toBeInTheDocument();
    expect(getByText('Includes a 1% MetaMask fee –')).toBeInTheDocument();
    expect(getByText('view all quotes')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('0.00008 ETH')).toBeInTheDocument();
    expect(getByText('Max fee:')).toBeInTheDocument();
    expect(getByText('Swap')).toBeInTheDocument();
  });

  it('renders the component with EIP-1559 enabled', () => {
    const state = createSwapsMockStore();
    state.metamask.selectedNetworkClientId = NetworkType.mainnet;
    state.metamask.networksMetadata = {
      [NetworkType.mainnet]: {
        EIPS: {},
        status: 'available',
      },
    };
    const store = configureMockStore(middleware)(state);
    const props = createProps();
    const { getByText } = renderWithProvider(<ReviewQuote {...props} />, store);
    expect(getByText('New quotes in')).toBeInTheDocument();
    expect(getByText('Quote rate*')).toBeInTheDocument();
    expect(getByText('Includes a 1% MetaMask fee –')).toBeInTheDocument();
    expect(getByText('view all quotes')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('0.00008 ETH')).toBeInTheDocument();
    expect(getByText('Max fee:')).toBeInTheDocument();
    expect(getByText('Swap')).toBeInTheDocument();
  });

  it('renders text for token approval', () => {
    const state = createSwapsMockStore();
    state.metamask.swapsState.quotes.TEST_AGG_2.approvalNeeded = {
      data: '0x095ea7b300000000000000000000000095e6f48254609a6ee006f7d493c8e5fb97094cef0000000000000000000000000000000000000000004a817c7ffffffdabf41c00',
      to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      amount: '0',
      from: '0x2369267687A84ac7B494daE2f1542C40E37f4455',
      gas: '12',
      gasPrice: '34',
    };
    const store = configureMockStore(middleware)(state);
    const props = createProps();
    const { getByText } = renderWithProvider(<ReviewQuote {...props} />, store);
    expect(getByText('New quotes in')).toBeInTheDocument();
    expect(getByText('Quote rate*')).toBeInTheDocument();
    expect(getByText('Includes a 1% MetaMask fee –')).toBeInTheDocument();
    expect(getByText('view all quotes')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('0.00008 ETH')).toBeInTheDocument();
    expect(getByText('Max fee:')).toBeInTheDocument();
    expect(getByText('enable DAI')).toBeInTheDocument();
    expect(getByText('Edit limit')).toBeInTheDocument();
    expect(getByText('Swap')).toBeInTheDocument();
  });

  it('renders the component with gas included quotes', () => {
    const state = createSwapsMockStore();
    state.metamask.swapsState.quotes.TEST_AGG_2.isGasIncludedTrade = true;
    state.metamask.marketData[CHAIN_IDS.MAINNET][
      '0x6B175474E89094C44Da98b954EedeAC495271d0F' // DAI token contract address.
    ] = {
      price: 2,
      contractPercentChange1d: 0.004,
      priceChange1d: 0.00004,
    };
    state.metamask.currencyRates.ETH = {
      conversionDate: 1708532473.416,
      conversionRate: 2918.02,
      usdConversionRate: 2918.02,
    };
    const store = configureMockStore(middleware)(state);
    const props = createProps();
    const { getByText } = renderWithProvider(<ReviewQuote {...props} />, store);
    expect(getByText('New quotes in')).toBeInTheDocument();
    expect(getByText('Quote rate*')).toBeInTheDocument();
    expect(
      getByText('* Includes gas and a 1% MetaMask fee'),
    ).toBeInTheDocument();
    expect(getByText('view all quotes')).toBeInTheDocument();
    expect(getByText('Gas fee')).toBeInTheDocument();
    // $6.82 gas fee is calculated based on params set in the the beginning of the test.
    expect(getByText('$6.82')).toBeInTheDocument();
    expect(getByText('Swap')).toBeInTheDocument();
  });

  describe('uses gas fee estimates from transaction controller if 1559 and smart disabled', () => {
    let smartDisabled1559State;

    beforeEach(() => {
      smartDisabled1559State = createSwapsMockStore();
      smartDisabled1559State.metamask.selectedNetworkClientId =
        NetworkType.mainnet;
      smartDisabled1559State.metamask.networksMetadata = {
        [NetworkType.mainnet]: {
          EIPS: { 1559: true },
          status: 'available',
        },
      };
      smartDisabled1559State.metamask.preferences.smartTransactionsOptInStatus = false;
    });

    it('with only trade transaction', async () => {
      getSwap1559GasFeeEstimatesMock.mockResolvedValueOnce({
        estimatedBaseFee: '0x1',
        tradeGasFeeEstimates: {
          maxFeePerGas: '0x2',
          maxPriorityFeePerGas: '0x3',
          baseAndPriorityFeePerGas: '0x123456789123',
        },
        approveGasFeeEstimates: undefined,
      });

      const store = configureMockStore(middleware)(smartDisabled1559State);
      const props = createProps();
      const { getByText } = renderWithProvider(
        <ReviewQuote {...props} />,
        store,
      );

      await act(() => {
        // Intentionally empty
      });

      expect(getByText('Estimated gas fee')).toBeInTheDocument();
      expect(getByText('3.94315 ETH')).toBeInTheDocument();
      expect(getByText('Max fee:')).toBeInTheDocument();
      expect(getByText('$7.37')).toBeInTheDocument();
    });

    it('with trade and approve transactions', async () => {
      smartDisabled1559State.metamask.swapsState.quotes.TEST_AGG_2.approvalNeeded =
        {
          data: '0x095ea7b300000000000000000000000095e6f48254609a6ee006f7d493c8e5fb97094cef0000000000000000000000000000000000000000004a817c7ffffffdabf41c00',
          to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          amount: '0',
          from: '0x2369267687A84ac7B494daE2f1542C40E37f4455',
          gas: '123456',
        };

      getSwap1559GasFeeEstimatesMock.mockResolvedValueOnce({
        estimatedBaseFee: '0x1',
        tradeGasFeeEstimates: {
          maxFeePerGas: '0x2',
          maxPriorityFeePerGas: '0x3',
          baseAndPriorityFeePerGas: '0x123456789123',
        },
        approveGasFeeEstimates: {
          maxFeePerGas: '0x4',
          maxPriorityFeePerGas: '0x5',
          baseAndPriorityFeePerGas: '0x9876543210',
        },
      });

      const store = configureMockStore(middleware)(smartDisabled1559State);
      const props = createProps();
      const { getByText } = renderWithProvider(
        <ReviewQuote {...props} />,
        store,
      );

      await act(() => {
        // Intentionally empty
      });

      expect(getByText('Estimated gas fee')).toBeInTheDocument();
      expect(getByText('4.72438 ETH')).toBeInTheDocument();
      expect(getByText('Max fee:')).toBeInTheDocument();
      expect(getByText('$8.15')).toBeInTheDocument();
    });
  });
});
