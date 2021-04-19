import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../../test/jest';
import AwaitingSwap from '.';

describe('AwaitingSwap', () => {
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
  const store = configureMockStore()(createSwapsMockStore());

  it('renders the component with initial props', () => {
    const { container, getByText } = renderWithProvider(
      <AwaitingSwap {...createProps()} />,
      store,
    );
    expect(getByText('[swapProcessing]')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
