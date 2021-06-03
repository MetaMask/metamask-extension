import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import AwaitingSwap from '.';

const createProps = (customProps = {}) => {
  return {
    swapComplete: false,
    txHash: 'txHash',
    tokensReceived: 'tokensReceived',
    submittingSwap: true,
    inputValue: 5,
    maxSlippage: 3,
    ...customProps,
  };
};

describe('AwaitingSwap', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...createProps()} />,
      store,
    );
    expect(getByText('Processing')).toBeInTheDocument();
    expect(getByText('ETH')).toBeInTheDocument();
    expect(getByText('View in activity')).toBeInTheDocument();
    expect(
      document.querySelector('.awaiting-swap__main-descrption'),
    ).toMatchSnapshot();
    expect(document.querySelector('.swaps-footer')).toMatchSnapshot();
  });
});
