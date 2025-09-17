import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  ADD_WALLET_PAGE_ROUTE,
  CONNECT_HARDWARE_ROUTE,
  IMPORT_SRP_ROUTE,
} from '../../../helpers/constants/routes';
import { AddWalletModal } from './add-wallet-modal';

const mockOpenExtensionInBrowser = jest.fn();

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: () => 'popup',
}));

describe('AddWalletModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(mockUseNavigate).toHaveBeenCalledWith(IMPORT_SRP_ROUTE);
  });

  it('calls onClose and navigates when import account option is clicked', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Import an account'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith(ADD_WALLET_PAGE_ROUTE);
  });

  it('calls onClose and opens hardware wallet route in expanded view', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Add a hardware wallet'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(
      CONNECT_HARDWARE_ROUTE,
    );
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    renderWithProvider(<AddWalletModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Add wallet')).not.toBeInTheDocument();
  });
});
