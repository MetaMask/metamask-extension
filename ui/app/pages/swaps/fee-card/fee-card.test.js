import React from 'react';
import { render } from '@testing-library/react';

import { MAINNET_CHAIN_ID } from '../../../../../shared/constants/network';
import FeeCard from './fee-card';

describe('FeeCard', () => {
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

  it('renders the component with initial props', () => {
    const { container } = render(<FeeCard {...createProps()} />);
    expect(container).toMatchSnapshot();
  });
});
