import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import ExchangeRateDisplay from '.';

const createProps = (customProps = {}) => {
  return {
    primaryTokenValue: '2000000000000000000',
    primaryTokenDecimals: 18,
    primaryTokenSymbol: 'ETH',
    secondaryTokenValue: '200000000000000000',
    secondaryTokenDecimals: 18,
    secondaryTokenSymbol: 'BAT',
    ...customProps,
  };
};

describe('ExchangeRateDisplay', () => {
  it('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByText } = renderWithProvider(
      <ExchangeRateDisplay {...props} />,
    );
    expect(getByText(props.primaryTokenSymbol)).toBeInTheDocument();
    expect(getByText(props.secondaryTokenSymbol)).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
