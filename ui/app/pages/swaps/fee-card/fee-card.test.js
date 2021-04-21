import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import { MAINNET_CHAIN_ID } from '../../../../../shared/constants/network';
import FeeCard from '.';

const createProps = (customProps = {}) => {
  return {
    primaryFee: '1 ETH',
    secondaryFee: '2500 USD',
    hideTokenApprovalRow: false,
    onFeeCardMaxRowClick: jest.fn(),
    tokenApprovalTextComponent: <></>,
    tokenApprovalSourceTokenSymbol: 'ABC',
    onTokenApprovalClick: jest.fn(),
    metaMaskFee: '0.875',
    isBestQuote: true,
    numberOfQuotes: 6,
    onQuotesClick: jest.fn(),
    tokenConversionRate: 0.015,
    chainId: MAINNET_CHAIN_ID,
    ...customProps,
  };
};

describe('FeeCard', () => {
  it('renders the component with initial props', () => {
    const { getByText } = renderWithProvider(<FeeCard {...createProps()} />);
    expect(getByText('Using the best quote')).toBeInTheDocument();
    expect(getByText('6 quotes')).toBeInTheDocument();
    expect(getByText('Max network fee')).toBeInTheDocument();
    expect(getByText('Estimated network fee')).toBeInTheDocument();
    expect(
      getByText('Quote includes a 0.875% MetaMask fee'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('.fee-card__savings-and-quotes-header'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.fee-card__top-bordered-row'),
    ).toMatchSnapshot();
  });
});
