import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { exportAsFile } from '../../../helpers/utils/export-utils';
import AdvancedTab from '.';

const mockSetAutoLockTimeLimit = jest.fn().mockReturnValue({ type: 'TYPE' });
const mockSetShowTestNetworks = jest.fn();
const mockSetShowFiatConversionOnTestnetsPreference = jest.fn();
const mockSetStxPrefEnabled = jest.fn();
const mockSetManageInstitutionalWallets = jest.fn();
const mockSetDismissSmartAccountSuggestionEnabled = jest.fn();
const mockSetUseSmartAccount = jest.fn();
const mockSetShowExtensionInFullSizeView = jest.fn();
const mockDisplayErrorInSettings = jest.fn();

jest.mock('../../../store/actions.ts', () => {
  return {
    setAutoLockTimeLimit: (...args) => mockSetAutoLockTimeLimit(...args),
    setShowTestNetworks: () => mockSetShowTestNetworks,
    setShowFiatConversionOnTestnetsPreference: () =>
      mockSetShowFiatConversionOnTestnetsPreference,
    setSmartTransactionsPreferenceEnabled: () => mockSetStxPrefEnabled,
    setManageInstitutionalWallets: () => mockSetManageInstitutionalWallets,
    setDismissSmartAccountSuggestionEnabled: () =>
      mockSetDismissSmartAccountSuggestionEnabled,
    setSmartAccountOptIn: () => mockSetUseSmartAccount,
    setShowExtensionInFullSizeView: () => mockSetShowExtensionInFullSizeView,
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
    const { container } = renderWithProvider(<AdvancedTab />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('should render export data button', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const exportDataButton = queryByTestId('export-data-button');
    expect(exportDataButton).toBeInTheDocument();
  });

  it('should default the auto-lockout time to 0', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const autoLockoutTime = queryByTestId('auto-lockout-time');

    expect(autoLockoutTime).toHaveValue('0');
  });

  it('should update the auto-lockout time', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const autoLockoutTime = queryByTestId('auto-lockout-time');
    const autoLockoutButton = queryByTestId('auto-lockout-button');

    fireEvent.change(autoLockoutTime, { target: { value: '1440' } });

    expect(autoLockoutTime).toHaveValue('1440');

    fireEvent.click(autoLockoutButton);

    expect(mockSetAutoLockTimeLimit).toHaveBeenCalled();
  });

  it('should update the auto-lockout time to 0 if the input field is set to empty', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const autoLockoutTime = queryByTestId('auto-lockout-time');
    const autoLockoutButton = queryByTestId('auto-lockout-button');

    fireEvent.change(autoLockoutTime, { target: { value: '' } });

    expect(autoLockoutTime).toHaveValue('');

    fireEvent.click(autoLockoutButton);

    expect(mockSetAutoLockTimeLimit).toHaveBeenCalledWith(0);
  });

  it('should toggle show fiat on test networks', () => {
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, mockStore);

    const testShowFiatOnTestnets = queryAllByRole('checkbox')[4];

    fireEvent.click(testShowFiatOnTestnets);

    expect(mockSetShowFiatConversionOnTestnetsPreference).toHaveBeenCalled();
  });

  it('should toggle show test networks', () => {
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, mockStore);

    const testNetworkToggle = queryAllByRole('checkbox')[5];

    fireEvent.click(testNetworkToggle);

    expect(mockSetShowTestNetworks).toHaveBeenCalled();
  });

  it('should toggle show extension in full size view', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);

    const fullSizeViewSection = queryByTestId(
      'advanced-setting-show-extension-in-full-size-view',
    );
    const fullSizeViewToggle = fullSizeViewSection.querySelector(
      'input[type="checkbox"]',
    );

    fireEvent.click(fullSizeViewToggle);

    expect(mockSetShowExtensionInFullSizeView).toHaveBeenCalled();
  });

  it('should toggle manage institutional wallets', () => {
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, mockStore);

    const manageInstitutionalWalletsToggle = queryAllByRole('checkbox')[6];

    fireEvent.click(manageInstitutionalWalletsToggle);

    expect(mockSetManageInstitutionalWallets).toHaveBeenCalled();
  });

  describe('renderToggleStxOptIn', () => {
    it('should render the toggle button for Smart Transactions', () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const toggleButton = queryByTestId('settings-page-stx-opt-in-toggle');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should call setSmartTransactionsOptInStatus when the toggle button is clicked', () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const toggleButton = queryByTestId('settings-page-stx-opt-in-toggle');
      fireEvent.click(toggleButton);
      expect(mockSetStxPrefEnabled).toHaveBeenCalled();
    });
  });

  describe('renderToggleUseSmartAccount', () => {
    it('should render the toggle button for smart account opt-in', () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const toggleButton = queryByTestId(
        'advanced-setting-smart-account-optin',
      );
      expect(toggleButton).toBeInTheDocument();
    });

    it('should call setSmartAccountOptIn when the toggle button is clicked', () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const toggleButton = queryByTestId('settings-page-smart-account-optin');
      fireEvent.click(toggleButton);
      expect(mockSetUseSmartAccount).toHaveBeenCalled();
    });
  });

  describe('renderToggleDismissSmartAccountSuggestion', () => {
    it('should render the toggle button for Dismiss Smart Account Suggestion', () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const toggleButton = queryByTestId(
        'advanced-setting-dismiss-smart-account-suggestion-enabled',
      );
      expect(toggleButton).toBeInTheDocument();
    });

    it('should call setSmartTransactionsOptInStatus when the toggle button is clicked', () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const toggleButton = queryByTestId(
        'settings-page-dismiss-smart-account-suggestion-enabled-toggle',
      );
      fireEvent.click(toggleButton);
      expect(mockSetDismissSmartAccountSuggestionEnabled).toHaveBeenCalled();
    });
  });

  describe('renderStateLogs', () => {
    it('should render the toggle button for state log download', () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const stateLogButton = queryByTestId('advanced-setting-state-logs');
      expect(stateLogButton).toBeInTheDocument();
    });

    it('should call exportAsFile when the toggle button is clicked', async () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const stateLogButton = queryByTestId(
        'advanced-setting-state-logs-button',
      );
      fireEvent.click(stateLogButton);
      await waitFor(() => {
        expect(exportAsFile).toHaveBeenCalledTimes(1);
      });
    });
    it('should call displayErrorInSettings when the state file download fails', async () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
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
