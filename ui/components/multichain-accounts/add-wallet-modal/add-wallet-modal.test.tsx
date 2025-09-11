import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import { AddWalletModal } from './add-wallet-modal';

describe('AddWalletModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders the modal when isOpen is true', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Add wallet')).toBeInTheDocument();
  });

  it('renders all wallet options', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Import a wallet')).toBeInTheDocument();
    expect(screen.getByText('Import an account')).toBeInTheDocument();
    expect(screen.getByText('Add a hardware wallet')).toBeInTheDocument();
  });

  it('calls onClose when a wallet option is clicked', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Import a wallet'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when isOpen is false', () => {
    renderWithProvider(<AddWalletModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Add wallet')).not.toBeInTheDocument();
  });
});
