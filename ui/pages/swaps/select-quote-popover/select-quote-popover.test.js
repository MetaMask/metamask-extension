import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import SelectQuotePopover from '.';

const createProps = (customProps = {}) => {
  return {
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    swapToSymbol: 'ETH',
    initialAggId: 'initialAggId',
    onQuoteDetailsIsOpened: jest.fn(),
    hideEstimatedGasFee: false,
    ...customProps,
  };
};

describe('SelectQuotePopover', () => {
  it('renders the component with initial props', () => {
    const { container } = renderWithProvider(
      <SelectQuotePopover {...createProps()} />,
    );
    expect(container).toMatchSnapshot();
  });
});
