import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { useSelector } from 'react-redux';

import { checkNetworkAndAccountSupports1559 } from '../../../selectors';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getIsGasEstimatesLoading,
} from '../../../ducks/metamask/metamask';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
  MOCKS,
} from '../../../../test/jest';
import { MAINNET_CHAIN_ID } from '../../../../shared/constants/network';
import FeeCard from '.';

const middleware = [thunk];

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const generateUseSelectorRouter = () => (selector) => {
  if (selector === checkNetworkAndAccountSupports1559) {
    return true;
  }
  if (selector === getGasEstimateType) {
    return 'fee-market';
  }
  if (selector === getGasFeeEstimates) {
    return MOCKS.createGasFeeEstimatesForFeeMarket();
  }
  if (selector === getIsGasEstimatesLoading) {
    return false;
  }
  return undefined;
};

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
});

const createProps = (customProps = {}) => {
  return {
    primaryFee: {
      fee: '0.0441 ETH',
      maxFee: '0.04851 ETH',
    },
    secondaryFee: {
      fee: '$101.98',
      maxFee: '$112.17',
    },
    hideTokenApprovalRow: false,
    onFeeCardMaxRowClick: jest.fn(),
    tokenApprovalTextComponent: (
      <span
        key="swaps-view-quote-approve-symbol-1"
        className="view-quote__bold"
      >
        ABC
      </span>
    ),
    tokenApprovalSourceTokenSymbol: 'ABC',
    onTokenApprovalClick: jest.fn(),
    metaMaskFee: '0.875',
    isBestQuote: true,
    numberOfQuotes: 6,
    onQuotesClick: jest.fn(),
    tokenConversionRate: 0.015,
    chainId: MAINNET_CHAIN_ID,
    networkAndAccountSupports1559: false,
    ...customProps,
  };
};

describe('FeeCard', () => {
  it('renders the component with initial props', () => {
    useSelector.mockImplementation(generateUseSelectorRouter());
    const props = createProps();
    const { getByText } = renderWithProvider(<FeeCard {...props} />);
    expect(getByText('Using the best quote')).toBeInTheDocument();
    expect(getByText('6 quotes')).toBeInTheDocument();
    expect(getByText('Max network fee')).toBeInTheDocument();
    expect(getByText('Estimated network fee')).toBeInTheDocument();
    expect(getByText(props.primaryFee.fee)).toBeInTheDocument();
    expect(getByText(props.primaryFee.maxFee)).toBeInTheDocument();
    expect(getByText(props.secondaryFee.fee)).toBeInTheDocument();
    expect(getByText(props.secondaryFee.maxFee)).toBeInTheDocument();
    expect(
      getByText('Quote includes a 0.875% MetaMask fee'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('.fee-card__savings-and-quotes-header'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.fee-card__top-bordered-row'),
    ).toMatchSnapshot();
  });

  it('renders the component with EIP-1559 enabled', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({
      networkAndAccountSupports1559: true,
      maxPriorityFeePerGasDecGWEI: '3',
      maxFeePerGasDecGWEI: '4',
    });
    const { getByText } = renderWithProvider(<FeeCard {...props} />, store);
    expect(getByText('Using the best quote')).toBeInTheDocument();
    expect(getByText('6 quotes')).toBeInTheDocument();
    expect(getByText('Estimated gas fee')).toBeInTheDocument();
    expect(getByText('Maybe in 5 minutes')).toBeInTheDocument();
    expect(getByText(props.primaryFee.fee)).toBeInTheDocument();
    expect(getByText(props.secondaryFee.fee)).toBeInTheDocument();
    expect(getByText(`: ${props.secondaryFee.maxFee}`)).toBeInTheDocument();
    expect(
      getByText('Quote includes a 0.875% MetaMask fee'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('.fee-card__savings-and-quotes-header'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.fee-card__top-bordered-row'),
    ).toMatchSnapshot();
  });
});
