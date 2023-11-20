import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { NetworkType } from '@metamask/controller-utils';
import { setBackgroundConnection } from '../../../store/background-connection';
import {
  renderWithProvider,
  createSwapsMockStore,
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
    expect(getByText('Quote rate')).toBeInTheDocument();
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
    expect(getByText('Quote rate')).toBeInTheDocument();
    expect(getByText('Includes a 1% MetaMask fee –')).toBeInTheDocument();
    expect(getByText('view all quotes')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('0.00008 ETH')).toBeInTheDocument();
    expect(getByText('Max fee:')).toBeInTheDocument();
    expect(getByText('enable DAI')).toBeInTheDocument();
    expect(getByText('Edit limit')).toBeInTheDocument();
    expect(getByText('Swap')).toBeInTheDocument();
  });
});
