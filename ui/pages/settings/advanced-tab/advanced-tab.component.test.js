//========
// Changes to this file demonstrate how the use of `useMessenger` in a
// non-shared component can be tested.
//========

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createMockRouteMessenger } from '../../../../test/lib/mock-route-messenger';
import { exportAsFile } from '../../../helpers/utils/export-utils';
import AdvancedTab from '.';

const mockDisplayErrorInSettings = jest.fn();

jest.mock('../../../store/actions.ts', () => {
  return {
    setAutoLockTimeLimit: jest.fn(),
    setShowTestNetworks: jest.fn(),
    setShowFiatConversionOnTestnetsPreference: jest.fn(),
    setSmartTransactionsPreferenceEnabled: jest.fn(),
    setManageInstitutionalWallets: jest.fn(),
    setDismissSmartAccountSuggestionEnabled: jest.fn(),
    setShowExtensionInFullSizeView: jest.fn(),
  };
});

jest.mock('../../../ducks/app/app.ts', () => ({
  displayErrorInSettings: () => mockDisplayErrorInSettings,
  hideErrorInSettings: () => jest.fn(),
}));

jest.mock('../../../helpers/utils/export-utils', () => ({
  ...jest.requireActual('../../../helpers/utils/export-utils'),
  exportAsFile: jest
    .fn()
    .mockResolvedValueOnce({})
    .mockImplementationOnce(new Error('state file error')),
}));

// Mock window.logStateString which is set up in ui/index.js
const mockLogStateString = jest.fn();
Object.defineProperty(window, 'logStateString', {
  value: mockLogStateString,
  writable: true,
});

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getPlatformInfo: jest.fn().mockResolvedValue('mac'),
  },
}));

Object.defineProperty(window, 'stateHooks', {
  value: {
    getCleanAppState: () => mockState,
    getLogs: () => [],
  },
});

describe('AdvancedTab Component', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const messenger = createMockRouteMessenger();
    const { container } = renderWithProvider(<AdvancedTab />, {
      store: mockStore,
      messenger,
    });

    expect(container).toMatchSnapshot();
  });

  it('should render export data button', () => {
    const messenger = createMockRouteMessenger();
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
      store: mockStore,
      messenger,
    });
    const exportDataButton = queryByTestId('export-data-button');
    expect(exportDataButton).toBeInTheDocument();
  });

  it('should default the auto-lockout time to 0', () => {
    const messenger = createMockRouteMessenger();
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
      store: mockStore,
      messenger,
    });
    const autoLockoutTime = queryByTestId('auto-lockout-time');

    expect(autoLockoutTime).toHaveValue('0');
  });

  it('should update the auto-lockout time', async () => {
    const setAutoLockTimeLimit = jest.fn().mockResolvedValue(undefined);
    const messenger = createMockRouteMessenger({
      'PreferencesController:setAutoLockTimeLimit': setAutoLockTimeLimit,
    });
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
      store: mockStore,
      messenger,
    });
    const autoLockoutTime = queryByTestId('auto-lockout-time');
    const autoLockoutButton = queryByTestId('auto-lockout-button');

    fireEvent.change(autoLockoutTime, { target: { value: '1440' } });

    expect(autoLockoutTime).toHaveValue('1440');

    fireEvent.click(autoLockoutButton);

    await waitFor(() => {
      expect(setAutoLockTimeLimit).toHaveBeenCalled();
    });
  });

  it('should update the auto-lockout time to 0 if the input field is set to empty', async () => {
    const setAutoLockTimeLimit = jest.fn().mockResolvedValue(undefined);
    const messenger = createMockRouteMessenger({
      'PreferencesController:setAutoLockTimeLimit': setAutoLockTimeLimit,
    });
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
      store: mockStore,
      messenger,
    });
    const autoLockoutTime = queryByTestId('auto-lockout-time');
    const autoLockoutButton = queryByTestId('auto-lockout-button');

    fireEvent.change(autoLockoutTime, { target: { value: '' } });

    expect(autoLockoutTime).toHaveValue('');

    fireEvent.click(autoLockoutButton);

    await waitFor(() => {
      expect(setAutoLockTimeLimit).toHaveBeenCalledWith(0);
    });
  });

  it('should toggle show fiat on test networks', async () => {
    const setShowFiatConversionOnTestnetsPreference = jest
      .fn()
      .mockResolvedValue(undefined);
    const messenger = createMockRouteMessenger({
      'PreferencesController:setShowFiatConversionOnTestnetsPreference':
        setShowFiatConversionOnTestnetsPreference,
    });
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, {
      store: mockStore,
      messenger,
    });

    const testShowFiatOnTestnets = queryAllByRole('checkbox')[3];

    fireEvent.click(testShowFiatOnTestnets);

    await waitFor(() => {
      expect(setShowFiatConversionOnTestnetsPreference).toHaveBeenCalled();
    });
  });

  it('should toggle show test networks', async () => {
    const setShowTestNetworks = jest.fn().mockResolvedValue(undefined);
    const messenger = createMockRouteMessenger({
      'PreferencesController:setShowTestNetworks': setShowTestNetworks,
    });
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, {
      store: mockStore,
      messenger,
    });

    const testNetworkToggle = queryAllByRole('checkbox')[4];

    fireEvent.click(testNetworkToggle);

    await waitFor(() => {
      expect(setShowTestNetworks).toHaveBeenCalled();
    });
  });

  it('should toggle show extension in full size view', async () => {
    const setShowExtensionInFullSizeView = jest
      .fn()
      .mockResolvedValue(undefined);
    const messenger = createMockRouteMessenger({
      'PreferencesController:setShowExtensionInFullSizeView':
        setShowExtensionInFullSizeView,
    });
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
      store: mockStore,
      messenger,
    });

    const fullSizeViewSection = queryByTestId(
      'advanced-setting-show-extension-in-full-size-view',
    );
    const fullSizeViewToggle = fullSizeViewSection.querySelector(
      'input[type="checkbox"]',
    );

    fireEvent.click(fullSizeViewToggle);

    await waitFor(() => {
      expect(setShowExtensionInFullSizeView).toHaveBeenCalled();
    });
  });

  it('should toggle manage institutional wallets', async () => {
    const setManageInstitutionalWallets = jest
      .fn()
      .mockResolvedValue(undefined);
    const messenger = createMockRouteMessenger({
      'PreferencesController:setManageInstitutionalWallets':
        setManageInstitutionalWallets,
    });
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, {
      store: mockStore,
      messenger,
    });

    const manageInstitutionalWalletsToggle = queryAllByRole('checkbox')[5];

    fireEvent.click(manageInstitutionalWalletsToggle);

    await waitFor(() => {
      expect(setManageInstitutionalWallets).toHaveBeenCalled();
    });
  });

  describe('renderToggleStxOptIn', () => {
    it('should render the toggle button for Smart Transactions', () => {
      const messenger = createMockRouteMessenger();
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
        store: mockStore,
        messenger,
      });
      const toggleButton = queryByTestId('settings-page-stx-opt-in-toggle');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should call setSmartTransactionsOptInStatus when the toggle button is clicked', async () => {
      const setSmartTransactionsEnabled = jest
        .fn()
        .mockResolvedValue(undefined);
      const messenger = createMockRouteMessenger({
        'PreferencesController:setSmartTransactionsEnabled':
          setSmartTransactionsEnabled,
      });
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
        store: mockStore,
        messenger,
      });
      const toggleButton = queryByTestId('settings-page-stx-opt-in-toggle');
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(setSmartTransactionsEnabled).toHaveBeenCalled();
      });
    });
  });

  describe('renderToggleDismissSmartAccountSuggestion', () => {
    it('should render the toggle button for Dismiss Smart Account Suggestion', () => {
      const messenger = createMockRouteMessenger();
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
        store: mockStore,
        messenger,
      });
      const toggleButton = queryByTestId(
        'advanced-setting-dismiss-smart-account-suggestion-enabled',
      );
      expect(toggleButton).toBeInTheDocument();
    });

    it('should call setSmartTransactionsOptInStatus when the toggle button is clicked', async () => {
      const setDismissSmartAccountSuggestionEnabled = jest
        .fn()
        .mockResolvedValue(undefined);
      const messenger = createMockRouteMessenger({
        'PreferencesController:setDismissSmartAccountSuggestionEnabled':
          setDismissSmartAccountSuggestionEnabled,
      });
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
        store: mockStore,
        messenger,
      });
      const toggleButton = queryByTestId(
        'settings-page-dismiss-smart-account-suggestion-enabled-toggle',
      );
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(setDismissSmartAccountSuggestionEnabled).toHaveBeenCalled();
      });
    });
  });

  describe('renderStateLogs', () => {
    beforeEach(() => {
      mockLogStateString.mockClear();
      mockDisplayErrorInSettings.mockClear();
    });

    it('should render the toggle button for state log download', () => {
      const messenger = createMockRouteMessenger();
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
        store: mockStore,
        messenger,
      });
      const stateLogButton = queryByTestId('advanced-setting-state-logs');
      expect(stateLogButton).toBeInTheDocument();
    });

    it('should call exportAsFile when the toggle button is clicked', async () => {
      mockLogStateString.mockResolvedValue('{"state": "data"}');
      const messenger = createMockRouteMessenger();
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
        store: mockStore,
        messenger,
      });
      const stateLogButton = queryByTestId(
        'advanced-setting-state-logs-button',
      );
      fireEvent.click(stateLogButton);
      await waitFor(() => {
        expect(exportAsFile).toHaveBeenCalledTimes(1);
      });
    });

    it('should call displayErrorInSettings when the state file download fails', async () => {
      mockLogStateString.mockRejectedValue(new Error('state file error'));
      const messenger = createMockRouteMessenger();
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, {
        store: mockStore,
        messenger,
      });
      const stateLogButton = queryByTestId(
        'advanced-setting-state-logs-button',
      );
      fireEvent.click(stateLogButton);
      await waitFor(() => {
        expect(mockDisplayErrorInSettings).toHaveBeenCalledTimes(1);
      });
    });
  });
});
