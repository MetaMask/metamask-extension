import React from 'react';
import configureMockStore from 'redux-mock-store';

import AwaitingSwap from './index';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

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
  const store = configureMockStore()(global.createSwapsMockStore());

  test('renders the component with initial props', () => {
    const { container, getByText } = renderWithProvider(<AwaitingSwap {...createProps()} />, store);
    expect(getByText('[swapProcessing]')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
