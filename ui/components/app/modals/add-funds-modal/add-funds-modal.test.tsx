import React from 'react';
import AddFundsModal from './add-funds-modal';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

describe('CancelTransactionGasFee Component', () => {
  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <AddFundsModal onClose={jest.fn()} />,
    );

    expect(container).toMatchSnapshot();
  });
});
