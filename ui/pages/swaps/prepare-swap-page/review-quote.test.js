import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
  MOCKS,
} from '../../../../test/jest';
import ReviewQuote from './review-quote';

jest.mock(
  '../../../components/ui/info-tooltip/info-tooltip-icon',
  () => () => '<InfoTooltipIcon />',
);

jest.mock('../../../hooks/gasFeeInput/useGasFeeInputs', () => {
  return {
    useGasFeeInputs: () => {
      return {
        maxFeePerGas: 16,
        maxPriorityFeePerGas: 3,
        gasFeeEstimates: MOCKS.createGasFeeEstimatesForFeeMarket(),
      };
    },
  };
});

const middleware = [thunk];
const createProps = (customProps = {}) => {
  return {
    setReceiveToAmount: jest.fn(),
    ...customProps,
  };
};

setBackgroundConnection({
  resetPostFetchState: jest.fn(),
  safeRefetchQuotes: jest.fn(),
  setSwapsErrorKey: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
  updateTransaction: jest.fn(),
  getGasFeeTimeEstimate: jest.fn(),
  setSwapsQuotesPollingLimitEnabled: jest.fn(),
});

describe('ReviewQuote', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(<ReviewQuote {...props} />, store);
    expect(getByText('New quotes in')).toBeInTheDocument();
    expect(getByText('Quote rate')).toBeInTheDocument();
    expect(getByText('MetaMask fee')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('0.00008 ETH')).toBeInTheDocument();
    expect(getByText('Max fee:')).toBeInTheDocument();
    expect(getByText('Swap')).toBeInTheDocument();
  });

  it('renders the component with EIP-1559 enabled', () => {
    const state = createSwapsMockStore();
    state.metamask.networkDetails = {
      EIPS: {
        1559: true,
      },
    };
    const store = configureMockStore(middleware)(state);
    const props = createProps();
    const { getByText } = renderWithProvider(<ReviewQuote {...props} />, store);
    expect(getByText('New quotes in')).toBeInTheDocument();
    expect(getByText('Quote rate')).toBeInTheDocument();
    expect(getByText('MetaMask fee')).toBeInTheDocument();
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
    expect(getByText('Quote rate')).toBeInTheDocument();
    expect(getByText('MetaMask fee')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('0.00008 ETH')).toBeInTheDocument();
    expect(getByText('Max fee:')).toBeInTheDocument();
    expect(getByText('enable DAI')).toBeInTheDocument();
    expect(getByText('Edit limit')).toBeInTheDocument();
    expect(getByText('Swap')).toBeInTheDocument();
  });
});
