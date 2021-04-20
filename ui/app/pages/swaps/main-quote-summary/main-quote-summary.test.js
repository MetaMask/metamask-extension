import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import MainQuoteSummary from '.';

const createProps = (customProps = {}) => {
  return {
    sourceValue: '2000000000000000000',
    sourceDecimals: 18,
    sourceSymbol: 'ETH',
    destinationValue: '200000000000000000',
    destinationDecimals: 18,
    destinationSymbol: 'BAT',
    ...customProps,
  };
};

describe('MainQuoteSummary', () => {
  it('renders the component with initial props', () => {
    const props = createProps();
    const { container, getAllByText } = renderWithProvider(
      <MainQuoteSummary {...props} />,
    );
    expect(getAllByText(props.sourceSymbol)).toHaveLength(2);
    expect(getAllByText(props.destinationSymbol)).toHaveLength(2);
    expect(container).toMatchSnapshot();
  });
});
