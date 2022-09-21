import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
  fireEvent,
} from '../../../../test/jest';
import { setSwapsFromToken, setSwapToToken } from '../../../ducks/swaps/swaps';
import BuildQuote from '.';

const middleware = [thunk];
const createProps = (customProps = {}) => {
  return {
    ethBalance: '0x8',
    selectedAccountAddress: 'selectedAccountAddress',
    isFeatureFlagLoaded: false,
    shuffledTokensList: [],
    ...customProps,
  };
};

setBackgroundConnection({
  resetPostFetchState: jest.fn(),
  ignoreTokens: jest.fn(),
  setBackgroundSwapRouteState: jest.fn(),
  clearSwapsQuotes: jest.fn(),
  stopPollingForQuotes: jest.fn(),
  clearSmartTransactionFees: jest.fn(),
  setSwapsFromToken: jest.fn(),
});

jest.mock('../../../ducks/swaps/swaps', () => {
  const actual = jest.requireActual('../../../ducks/swaps/swaps');
  return {
    ...actual,
    setSwapsFromToken: jest.fn(),
    setSwapToToken: jest.fn(),
  };
});

describe('BuildQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(<BuildQuote {...props} />, store);
    expect(getByText('Swap from')).toBeInTheDocument();
    expect(getByText('Swap to')).toBeInTheDocument();
    expect(getByText('Select')).toBeInTheDocument();
    expect(getByText('Slippage tolerance')).toBeInTheDocument();
    expect(getByText('2%')).toBeInTheDocument();
    expect(getByText('3%')).toBeInTheDocument();
    expect(getByText('Review swap')).toBeInTheDocument();
    expect(
      document.querySelector('.slippage-buttons__button-group'),
    ).toMatchSnapshot();
  });

  it('switches swap from and to tokens', () => {
    const setSwapFromTokenMock = jest.fn(() => {
      return {
        type: 'MOCK_ACTION',
      };
    });
    setSwapsFromToken.mockImplementation(setSwapFromTokenMock);
    const setSwapToTokenMock = jest.fn(() => {
      return {
        type: 'MOCK_ACTION',
      };
    });
    setSwapToToken.mockImplementation(setSwapToTokenMock);
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByText, getByTestId } = renderWithProvider(
      <BuildQuote {...props} />,
      store,
    );
    expect(getByText('Swap from')).toBeInTheDocument();
    fireEvent.click(getByTestId('build-quote__swap-arrows'));
    expect(setSwapsFromToken).toHaveBeenCalledWith('USDC');
    expect(setSwapToToken).toHaveBeenCalled();
  });
});
