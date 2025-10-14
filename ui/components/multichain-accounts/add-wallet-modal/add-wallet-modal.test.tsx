import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  ADD_WALLET_PAGE_ROUTE,
  CONNECT_HARDWARE_ROUTE,
  IMPORT_SRP_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getIsAddSnapAccountEnabled,
  getIsWatchEthereumAccountEnabled,
} from '../../../selectors';
import { AddWalletModal } from './add-wallet-modal';

const mockHistoryPush = jest.fn();
const mockOpenExtensionInBrowser = jest.fn();
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: () => 'popup',
}));

describe('AddWalletModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockHistoryPush.mockClear();
    mockOpenExtensionInBrowser.mockClear();

    // Mock useSelector to return false for manageInstitutionalWallets by default
    mockUseSelector.mockReturnValue(false);

    // @ts-expect-error mocking platform
    global.platform = {
      openExtensionInBrowser: mockOpenExtensionInBrowser,
    };
  });

  it('renders the modal when isOpen is true', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('addWallet')).toBeInTheDocument();
  });

  it('renders all wallet options', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('importAWallet')).toBeInTheDocument();
    expect(screen.getByText('importAnAccount')).toBeInTheDocument();
    expect(screen.getByText('addAHardwareWallet')).toBeInTheDocument();
  });

  it('calls onClose and navigates when import wallet option is clicked', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('importAWallet'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(IMPORT_SRP_ROUTE);
  });

  it('calls onClose and navigates when import account option is clicked', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('importAnAccount'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(ADD_WALLET_PAGE_ROUTE);
  });

  it('calls onClose and opens hardware wallet route in expanded view', () => {
    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('addAHardwareWallet'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(
      CONNECT_HARDWARE_ROUTE,
    );
    expect(mockHistoryPush).not.toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    renderWithProvider(<AddWalletModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('addWallet')).not.toBeInTheDocument();
  });

  it('does not render the institutional wallet option if institutional wallets are disabled', () => {
    // Mock useSelector to return false for manageInstitutionalWallets
    mockUseSelector.mockReturnValue(false);

    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    expect(
      screen.queryByText('manageInstitutionalWallets'),
    ).not.toBeInTheDocument();
  });

  it('renders the institutional wallet option if institutional wallets are enabled', () => {
    // Mock useSelector to return true for manageInstitutionalWallets
    mockUseSelector.mockReturnValue(true);

    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('manageInstitutionalWallets')).toBeInTheDocument();
  });

  it('renders the add snap account option when addSnapAccountEnabled is true', () => {
    mockUseSelector.mockImplementation((selector) => {
      return selector === getIsAddSnapAccountEnabled;
    });

    // Mock platform.openTab
    // @ts-expect-error mocking platform
    global.platform = {
      ...global.platform,
      openTab: jest.fn(),
    };

    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    const snapAccountOption = screen.getByTestId(
      'add-wallet-modal-snap-account',
    );

    expect(snapAccountOption).toBeInTheDocument();
    expect(screen.getByText('settingAddSnapAccount')).toBeInTheDocument();

    fireEvent.click(snapAccountOption);

    expect(global.platform.openTab).toHaveBeenCalled();
  });

  it('renders the watch Ethereum account option when isAddWatchEthereumAccountEnabled is true', () => {
    mockUseSelector.mockImplementation((selector) => {
      return selector === getIsWatchEthereumAccountEnabled;
    });

    const mockTrackEvent = jest.fn();
    jest.spyOn(React, 'useContext').mockImplementation(() => mockTrackEvent);

    renderWithProvider(<AddWalletModal isOpen={true} onClose={mockOnClose} />);

    const watchAccountOption = screen.getByTestId(
      'add-wallet-modal-watch-ethereum-account',
    );

    expect(watchAccountOption).toBeInTheDocument();
    expect(screen.getByText('addEthereumWatchOnlyAccount')).toBeInTheDocument();
  });
});
