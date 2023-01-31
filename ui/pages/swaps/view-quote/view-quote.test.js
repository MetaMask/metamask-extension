import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
  MOCKS,
} from '../../../../test/jest';
import ViewQuote from '.';

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
    inputValue: '5',
    onInputChange: jest.fn(),
    ethBalance: '6 ETH',
    setMaxSlippage: jest.fn(),
    maxSlippage: 15,
    selectedAccountAddress: 'selectedAccountAddress',
    isFeatureFlagLoaded: false,
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

describe('ViewQuote', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByText, getByTestId } = renderWithProvider(
      <ViewQuote {...props} />,
      store,
    );
    expect(getByText('New quotes in')).toBeInTheDocument();
    expect(getByTestId('main-quote-summary__source-row')).toMatchSnapshot();
    expect(
      getByTestId('main-quote-summary__exchange-rate-container'),
    ).toMatchSnapshot();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('0.00008 ETH')).toBeInTheDocument();
    expect(getByText('Max fee')).toBeInTheDocument();
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
    const { getByText, getByTestId } = renderWithProvider(
      <ViewQuote {...props} />,
      store,
    );
    expect(getByText('New quotes in')).toBeInTheDocument();
    expect(getByTestId('main-quote-summary__source-row')).toMatchSnapshot();
    expect(
      getByTestId('main-quote-summary__exchange-rate-container'),
    ).toMatchSnapshot();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('0.00008 ETH')).toBeInTheDocument();
    expect(getByText('Max fee')).toBeInTheDocument();
    expect(getByText('Swap')).toBeInTheDocument();
  });
});
