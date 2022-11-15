import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import { SLIPPAGE } from '../../../../shared/constants/swaps';
import AwaitingSwap from '.';

const createProps = (customProps = {}) => {
  return {
    swapComplete: false,
    txHash: 'txHash',
    tokensReceived: 'tokens received:',
    submittingSwap: true,
    inputValue: 5,
    maxSlippage: SLIPPAGE.DEFAULT,
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
      document.querySelector('.awaiting-swap__main-description'),
    ).toMatchSnapshot();
    expect(getByText('View in activity')).toBeInTheDocument();
  });

  it('renders the component with for completed swap', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <AwaitingSwap {...createProps({ swapComplete: true })} />,
      store,
    );
    expect(getByText('Transaction complete')).toBeInTheDocument();
    expect(getByText('tokens received: ETH')).toBeInTheDocument();
    expect(getByText('View Swap at etherscan.io')).toBeInTheDocument();
    expect(getByText('Create a new swap')).toBeInTheDocument();
  });
});
