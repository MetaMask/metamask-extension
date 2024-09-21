import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
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
const store = configureStore(mockState);

describe('SelectQuotePopover', () => {
  it('renders the component with initial props', () => {
    const { container } = renderWithProvider(
      <SelectQuotePopover {...createProps()} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });
});
