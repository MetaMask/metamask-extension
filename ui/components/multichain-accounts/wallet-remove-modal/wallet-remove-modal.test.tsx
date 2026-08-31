import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { WalletRemoveModal } from './wallet-remove-modal';

describe('WalletRemoveModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    onBackupNow: jest.fn(),
    walletName: 'Wallet 2',
    isBackedUp: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal header, description, and buttons without backup warning when backed up', () => {
    renderWithProvider(<WalletRemoveModal {...defaultProps} isBackedUp />);
    expect(screen.getByText('Remove this wallet')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Back up your Secret Recovery Phrase before removing this wallet. Without it, you won't be able to recover your assets.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('wallet-remove-modal-banner'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders conditional danger banner when wallet is not backed up', () => {
    renderWithProvider(<WalletRemoveModal {...defaultProps} isBackedUp={false} />);
    expect(screen.getByTestId('wallet-remove-modal-banner')).toBeInTheDocument();
    expect(
      screen.getByText('This wallet is not backed up yet.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Back up now')).toBeInTheDocument();
  });

  it('renders banner without backup button if onBackupNow is not provided', () => {
    renderWithProvider(
      <WalletRemoveModal
        {...defaultProps}
        onBackupNow={undefined}
        isBackedUp={false}
      />,
    );
    expect(screen.getByTestId('wallet-remove-modal-banner')).toBeInTheDocument();
    expect(
      screen.getByText('This wallet is not backed up yet.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Back up now')).not.toBeInTheDocument();
  });

  it('triggers onBackupNow when clicking Back up now link in banner', () => {
    renderWithProvider(<WalletRemoveModal {...defaultProps} isBackedUp={false} />);
    fireEvent.click(screen.getByText('Back up now'));
    expect(defaultProps.onBackupNow).toHaveBeenCalledTimes(1);
  });

  it('triggers onSubmit when clicking Remove button', () => {
    renderWithProvider(<WalletRemoveModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Remove'));
    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when clicking Cancel button', () => {
    renderWithProvider(<WalletRemoveModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
