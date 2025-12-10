import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { AdvancedEIP1559Modal } from './advanced-eip1559-modal';

describe('AdvancedEIP1559Modal', () => {
  const mockSetActiveModal = jest.fn();
  const mockHandleCloseModals = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with header', () => {
    const { getByText } = renderWithProvider(
      <AdvancedEIP1559Modal
        setActiveModal={mockSetActiveModal}
        handleCloseModals={mockHandleCloseModals}
      />,
    );

    expect(getByText('Advanced EIP1559')).toBeInTheDocument();
  });
});
