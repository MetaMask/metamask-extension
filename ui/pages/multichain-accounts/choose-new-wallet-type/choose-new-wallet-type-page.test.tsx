import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  CONNECT_HARDWARE_ROUTE,
  IMPORT_SRP_ROUTE,
  ADD_WALLET_PAGE_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { ChooseNewWalletTypePage } from './choose-new-wallet-type-page';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const mockGetEnvironmentType = jest.fn();

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../shared/lib/environment-type'),
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

const mockOpenExtensionInBrowser = jest.fn();
const mockOpenTab = jest.fn();

beforeAll(() => {
  // @ts-expect-error mocking platform
  globalThis.platform = {
    openExtensionInBrowser: mockOpenExtensionInBrowser,
    openTab: mockOpenTab,
  };
});

describe('ChooseNewWalletTypePage', () => {
  const createMockStore = (overrides = {}) => {
    return configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        ...overrides,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue('fullscreen');
  });

  const renderComponent = (storeOverrides = {}) => {
    const store = createMockStore(storeOverrides);
    return renderWithProvider(<ChooseNewWalletTypePage />, store);
  };

  describe('rendering', () => {
    it('renders the page with header title', () => {
      renderComponent();

      expect(screen.getByText(messages.addAWallet.message)).toBeInTheDocument();
    });

    it('renders the back button', () => {
      renderComponent();

      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('renders the import wallet option', () => {
      renderComponent();

      expect(
        screen.getByTestId('choose-wallet-type-import-wallet'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.importAWallet.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.importAWalletDescription.message),
      ).toBeInTheDocument();
    });

    it('renders the import account option', () => {
      renderComponent();

      expect(
        screen.getByTestId('choose-wallet-type-import-account'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.importAnAccount.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.importAnAccountDescription.message),
      ).toBeInTheDocument();
    });

    it('renders the hardware wallet option', () => {
      renderComponent();

      expect(
        screen.getByTestId('choose-wallet-type-hardware-wallet'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.connectAHardwareWallet.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.connectAHardwareWalletDescription.message),
      ).toBeInTheDocument();
    });

    it('does not render snap account option when disabled', () => {
      renderComponent({ addSnapAccountEnabled: false });

      expect(
        screen.queryByTestId('choose-wallet-type-snap-account'),
      ).not.toBeInTheDocument();
    });

    it('renders snap account option when enabled', () => {
      renderComponent({ addSnapAccountEnabled: true });

      expect(
        screen.getByTestId('choose-wallet-type-snap-account'),
      ).toBeInTheDocument();
    });

    it('does not render watch account option when disabled', () => {
      renderComponent({ watchEthereumAccountEnabled: false });

      expect(
        screen.queryByTestId('choose-wallet-type-watch-ethereum-account'),
      ).not.toBeInTheDocument();
    });

    it('renders watch account option when enabled', () => {
      renderComponent({ watchEthereumAccountEnabled: true });

      expect(
        screen.getByTestId('choose-wallet-type-watch-ethereum-account'),
      ).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to account list when back button is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('back-button'));

      expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
    });

    it('navigates to import SRP route when import wallet is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('choose-wallet-type-import-wallet'));

      expect(mockUseNavigate).toHaveBeenCalledWith(IMPORT_SRP_ROUTE);
    });

    it('navigates to add wallet page when import account is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('choose-wallet-type-import-account'));

      expect(mockUseNavigate).toHaveBeenCalledWith(ADD_WALLET_PAGE_ROUTE);
    });

    it('navigates to hardware wallet route in fullscreen mode', () => {
      mockGetEnvironmentType.mockReturnValue('fullscreen');
      renderComponent();

      fireEvent.click(screen.getByTestId('choose-wallet-type-hardware-wallet'));

      expect(mockUseNavigate).toHaveBeenCalledWith(CONNECT_HARDWARE_ROUTE);
    });

    it('opens extension in browser for hardware wallet in popup mode', () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
      renderComponent();

      fireEvent.click(screen.getByTestId('choose-wallet-type-hardware-wallet'));

      expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(
        CONNECT_HARDWARE_ROUTE,
        null,
        false,
      );
      expect(mockUseNavigate).not.toHaveBeenCalledWith(CONNECT_HARDWARE_ROUTE);
    });

    it('opens extension in browser with keep-open for hardware wallet in sidepanel mode', () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
      renderComponent();

      fireEvent.click(screen.getByTestId('choose-wallet-type-hardware-wallet'));

      expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(
        CONNECT_HARDWARE_ROUTE,
        null,
        true,
      );
    });
  });

  describe('keyboard interaction', () => {
    it('activates option on Enter key', () => {
      renderComponent();

      const importWalletOption = screen.getByTestId(
        'choose-wallet-type-import-wallet',
      );
      fireEvent.keyDown(importWalletOption, { key: 'Enter' });

      expect(mockUseNavigate).toHaveBeenCalledWith(IMPORT_SRP_ROUTE);
    });

    it('activates option on Space key', () => {
      renderComponent();

      const importAccountOption = screen.getByTestId(
        'choose-wallet-type-import-account',
      );
      fireEvent.keyDown(importAccountOption, { key: ' ' });

      expect(mockUseNavigate).toHaveBeenCalledWith(ADD_WALLET_PAGE_ROUTE);
    });

    it('does not activate option on other keys', () => {
      renderComponent();

      const importWalletOption = screen.getByTestId(
        'choose-wallet-type-import-wallet',
      );
      fireEvent.keyDown(importWalletOption, { key: 'Tab' });

      expect(mockUseNavigate).not.toHaveBeenCalled();
    });
  });
});
