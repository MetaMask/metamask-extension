import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
} from '../../../../test/jest';
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
  removeToken: jest.fn(),
  setBackgroundSwapRouteState: jest.fn(),
  clearSwapsQuotes: jest.fn(),
  stopPollingForQuotes: jest.fn(),
});

describe('BuildQuote', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(<BuildQuote {...props} />, store);
    expect(getByText('Swap from')).toBeInTheDocument();
    expect(getByText('Swap to')).toBeInTheDocument();
    expect(getByText('ETH')).toBeInTheDocument();
    expect(getByText('Slippage Tolerance')).toBeInTheDocument();
    expect(getByText('2%')).toBeInTheDocument();
    expect(getByText('3%')).toBeInTheDocument();
    expect(getByText('Review Swap')).toBeInTheDocument();
    expect(
      document.querySelector('.slippage-buttons__button-group'),
    ).toMatchSnapshot();
  });
});
