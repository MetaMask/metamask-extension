import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../../test/jest';
import quoteDataRows from '../mock-quote-data';
import QuoteDetails from './quote-details';

const createProps = (customProps = {}) => {
  return {
    ...quoteDataRows[0],
    slippage: 2,
    liquiditySourceKey: 'swapAggregator',
    minimumAmountReceived: '2',
    feeInEth: '0.0003',
    metaMaskFee: 0.0205,
    ...customProps,
  };
};

describe('ListItemSearch', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(
      <QuoteDetails {...props} />,
      store,
    );
    expect(getByText('Rate')).toBeInTheDocument();
  });
});
