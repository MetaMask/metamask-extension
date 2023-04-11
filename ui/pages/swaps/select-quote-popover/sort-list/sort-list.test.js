import React from 'react';

import { renderWithProvider, fireEvent } from '../../../../../test/jest';
import MockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import SortList from './sort-list';

jest.mock(
  '../../../../components/ui/info-tooltip/info-tooltip-icon',
  () => () => '<InfoTooltipIcon />',
);

const createProps = (customProps = {}) => {
  return {
    hideEstimatedGasFee: false,
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
  const store = configureStore(MockState);
  it('renders the component with initial props', () => {
    const { getByText } = renderWithProvider(
      <SortList {...createProps()} />,
      store,
    );
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

  it('clicks on the "destinationTokenValue" header', () => {
    const props = createProps();
    const { getByTestId } = renderWithProvider(<SortList {...props} />, store);
    fireEvent.click(getByTestId('select-quote-popover__receiving'));
    expect(props.setSortColumn).toHaveBeenCalledWith('destinationTokenValue');
  });

  it('clicks on the "rawNetworkFees" header', () => {
    const props = createProps();
    const { getByTestId } = renderWithProvider(<SortList {...props} />, store);
    fireEvent.click(getByTestId('select-quote-popover__network-fees-header'));
    expect(props.setSortColumn).toHaveBeenCalledWith('rawNetworkFees');
  });

  it('clicks on the first aggregator', () => {
    const props = createProps();
    const { getByTestId } = renderWithProvider(<SortList {...props} />, store);
    fireEvent.click(getByTestId('select-quote-popover-row-0'));
    expect(props.onSelect).toHaveBeenCalledWith('Agg1');
  });

  it('clicks on a caret for the first aggregator', () => {
    const props = createProps();
    const { getByTestId } = renderWithProvider(<SortList {...props} />, store);
    fireEvent.click(getByTestId('select-quote-popover__caret-right-0'));
    expect(props.onCaretClick).toHaveBeenCalledWith('Agg1');
  });
});
