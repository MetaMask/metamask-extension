import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import { AddWalletModal } from './add-wallet-modal';

const mockHistoryPush = jest.fn();
const mockOpenExtensionInBrowser = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

describe('AddWalletModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockHistoryPush.mockClear();
    mockOpenExtensionInBrowser.mockClear();

    // @ts-expect-error mocking platform
    global.platform = {
      openExtensionInBrowser: mockOpenExtensionInBrowser,
    };
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

  it('calls onClose and navigates when import wallet option is clicked', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Import a wallet'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith('/import-srp');
  });

  it('calls onClose and navigates when import account option is clicked', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Import an account'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith('/new-account');
  });

  it('calls onClose and opens hardware wallet route in expanded view', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Add a hardware wallet'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(
      '/new-account/connect',
    );
    expect(mockHistoryPush).not.toHaveBeenCalled();
  });

  it('falls back to history.push when openExtensionInBrowser is not available for hardware wallet', () => {
    // @ts-expect-error mocking platform
    global.platform = {};

    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Add a hardware wallet'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOpenExtensionInBrowser).not.toHaveBeenCalled();
    expect(mockHistoryPush).toHaveBeenCalledWith('/new-account/connect');
  });

  it('does not render when isOpen is false', () => {
    renderWithProvider(<AddWalletModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Add wallet')).not.toBeInTheDocument();
  });
});
