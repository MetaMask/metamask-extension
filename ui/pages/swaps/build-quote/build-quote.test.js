import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
} from '../../../../test/jest';
import BuildQuote from '.';

const middleware = [thunk];
const createProps = (customProps = {}) => {
  return {
    inputValue: '5',
    onInputChange: jest.fn(),
    ethBalance: '0x8',
    setMaxSlippage: jest.fn(),
    maxSlippage: 15,
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

  it('clicks on the max button', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByTestId } = renderWithProvider(
      <BuildQuote {...props} />,
      store,
    );
    fireEvent.click(getByTestId('build-quote__max-button'));
    expect(props.onInputChange).toHaveBeenCalled();
  });

  it('types a number inside the input field', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByDisplayValue } = renderWithProvider(
      <BuildQuote {...props} />,
      store,
    );
    fireEvent.change(getByDisplayValue('5'), {
      target: { value: '8' },
    });
    expect(props.onInputChange).toHaveBeenCalled();
  });
});
