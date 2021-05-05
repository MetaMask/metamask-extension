import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import SortList from './sort-list';

const createProps = (customProps = {}) => {
  return {
    selectedAggId: 'Agg2',
    onSelect: jest.fn(),
    onCaretClick: jest.fn(),
    swapToSymbol: 'WETH',
    quoteDataRows: [
      {
        aggId: 'Agg1',
        amountReceiving: '100 DAI',
        destinationTokenDecimals: 18,
        destinationTokenSymbol: 'DAI',
        destinationTokenValue: '100000000000000000000',
        isBestQuote: false,
        networkFees: '$15.25',
        quoteSource: 'AGG',
        rawNetworkFees: '10.25',
        slippage: 3,
        sourceTokenDecimals: 18,
        sourceTokenSymbol: 'ETH',
        sourceTokenValue: '250000000000000000',
      },
      {
        aggId: 'Agg2',
        amountReceiving: '101 DAI',
        destinationTokenDecimals: 18,
        destinationTokenSymbol: 'DAI',
        destinationTokenValue: '101000000000000000000',
        isBestQuote: false,
        networkFees: '$14.26',
        quoteSource: 'RFQ',
        rawNetworkFees: '10.26',
        slippage: 3,
        sourceTokenDecimals: 18,
        sourceTokenSymbol: 'ETH',
        sourceTokenValue: '250000000000000000',
      },
      {
        aggId: 'Agg3',
        amountReceiving: '102 DAI',
        destinationTokenDecimals: 18,
        destinationTokenSymbol: 'DAI',
        destinationTokenValue: '102000000000000000000',
        isBestQuote: false,
        networkFees: '$13.27',
        quoteSource: 'DEX',
        rawNetworkFees: '10.27',
        slippage: 3,
        sourceTokenDecimals: 18,
        sourceTokenSymbol: 'ETH',
        sourceTokenValue: '250000000000000000',
      },
    ],
    sortDirection: 1,
    setSortDirection: jest.fn(),
    sortColumn: 'slippage',
    setSortColumn: jest.fn(),
    ...customProps,
  };
};

describe('SortList', () => {
  it('renders the component with initial props', () => {
    const { getByText } = renderWithProvider(<SortList {...createProps()} />);
    expect(getByText('$15.25')).toBeInTheDocument();
    expect(getByText('$14.26')).toBeInTheDocument();
    expect(getByText('$13.27')).toBeInTheDocument();
    expect(
      document.querySelector('.select-quote-popover__receiving'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.select-quote-popover__network-fees-header'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.select-quote-popover__row--selected'),
    ).toMatchSnapshot();
  });
});
