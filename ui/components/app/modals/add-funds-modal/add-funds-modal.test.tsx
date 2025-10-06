import React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import AddFundsModal from './add-funds-modal';

describe('Add funds modal Component', () => {
  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <AddFundsModal onClose={jest.fn()} />,
    );

    expect(container).toMatchSnapshot();
  });
});
