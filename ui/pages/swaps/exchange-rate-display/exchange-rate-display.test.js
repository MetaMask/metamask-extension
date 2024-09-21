import React from 'react';

import { renderWithProvider, fireEvent } from '../../../../test/jest';
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

  it('clicks on the switch link', () => {
    const props = createProps();
    props.showIconForSwappingTokens = true;
    const { getByTestId } = renderWithProvider(
      <ExchangeRateDisplay {...props} />,
    );
    expect(getByTestId('exchange-rate-display-base-symbol')).toHaveTextContent(
      'ETH',
    );
    fireEvent.click(getByTestId('exchange-rate-display-switch'));
    expect(getByTestId('exchange-rate-display-base-symbol')).toHaveTextContent(
      'BAT',
    );
  });
});
