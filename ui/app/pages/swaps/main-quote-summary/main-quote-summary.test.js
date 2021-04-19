import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import MainQuoteSummary from './index';

describe('MainQuoteSummary', () => {
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

  test('renders the component with initial props', () => {
    const props = createProps();
    const { container, getAllByText } = renderWithProvider(
      <MainQuoteSummary {...props} />,
    );
    expect(getAllByText(props.sourceSymbol).length).toBe(2);
    expect(getAllByText(props.destinationSymbol).length).toBe(2);
    expect(container).toMatchSnapshot();
  });
});
