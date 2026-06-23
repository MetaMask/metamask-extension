import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SHOW_BASIC_FUNCTIONALITY_MODAL_OPEN } from '../../../store/actionConstants';
import { mockNetworkState } from '../../../../test/stub/networks';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import PrivacySettings from './privacy-settings';

const mockOpenBasicFunctionalityModal = jest.fn().mockImplementation(() => {
  return {
    type: SHOW_BASIC_FUNCTIONALITY_MODAL_OPEN,
  };
});

jest.mock('../../../ducks/app/app.ts', () => {
  return {
    openBasicFunctionalityModal: () => {
      return mockOpenBasicFunctionalityModal();
    },
    onboardingToggleBasicFunctionalityOn: jest.fn(() => ({
      type: 'ONBOARDING_TOGGLE_BASIC_FUNCTIONALITY_ON',
    })),
  };
});

// Avoid unit test warning from react-toggle-button (deprecated componentWillReceiveProps via react-motion).
jest.mock('react-toggle-button', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  function mockToggle({
    value,
    onToggle,
    passThroughInputProps,
  }: {
    value: boolean;
    onToggle: (v: boolean) => void;
    passThroughInputProps?: { 'data-testid'?: string };
  }) {
    return ReactActual.createElement('input', {
      type: 'checkbox',
      checked: value,
      'data-testid': passThroughInputProps?.['data-testid'],
      onChange: () => onToggle(value),
      readOnly: true,
    });
  }
  return mockToggle;
});

const renderPrivacySettings = (
  store = configureMockStore([thunk])({
    metamask: {
      ...mockNetworkState(
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.LINEA_MAINNET },
        { chainId: CHAIN_IDS.SEPOLIA },
        { chainId: CHAIN_IDS.LINEA_SEPOLIA },
      ),
      use4ByteResolution: true,
      useTokenDetection: false,
      useCurrencyRateCheck: true,
      useMultiAccountBalanceChecker: true,
      ipfsGateway: 'test.link',
      useAddressBarEnsResolution: true,
      useTransactionSimulations: true,
      useExternalServices: true,
      useSafeChainsListValidation: true,
      useExternalNameSources: true,
      openSeaEnabled: true,
      useNftDetection: false,
      isIpfsGatewayEnabled: true,
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
    },
    appState: {
      externalServicesOnboardingToggleState: true,
      backupAndSyncOnboardingToggleState: false,
    },
  }),
  trackEvent = jest.fn(),
) =>
  renderWithProvider(
    <MetaMetricsContext.Provider
      value={
        {
          trackEvent,
          bufferedTrace: jest.fn(),
          bufferedEndTrace: jest.fn(),
          onboardingParentContext: { current: null },
        } as never
      }
    >
      <Routes>
        <Route
          path={ONBOARDING_PRIVACY_SETTINGS_ROUTE}
          element={<PrivacySettings />}
        />
        <Route
          path={ONBOARDING_COMPLETION_ROUTE}
          element={<div data-testid="onboarding-completion-page" />}
        />
      </Routes>
    </MetaMetricsContext.Provider>,
    store,
    ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  );

describe('Privacy Settings Onboarding View', () => {
  const setUseMultiAccountBalanceCheckerStub = jest
    .fn()
    .mockResolvedValue(true);

  setBackgroundConnection({
    setUseMultiAccountBalanceChecker: setUseMultiAccountBalanceCheckerStub,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the landing page with navigation items', () => {
    renderPrivacySettings();

    expect(screen.getByTestId('privacy-settings-landing')).toBeInTheDocument();
    expect(
      screen.getByTestId('onboarding-privacy-settings-item-privacy'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('onboarding-privacy-settings-item-backup-and-sync'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('onboarding-privacy-settings-item-network-rpc'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.defaultSettingsTitle.message),
    ).toBeInTheDocument();
  });

  it('navigates to onboarding completion from the landing back button', () => {
    renderPrivacySettings();

    fireEvent.click(screen.getByTestId('privacy-settings-back-button'));

    expect(
      screen.getByTestId('onboarding-completion-page'),
    ).toBeInTheDocument();
  });

  it('renders privacy settings and dispatches immediately on toggle', () => {
    renderPrivacySettings();

    fireEvent.click(
      screen.getByTestId('onboarding-privacy-settings-item-privacy'),
    );

    expect(screen.getByTestId('privacy-settings-settings')).toBeInTheDocument();
    expect(
      screen.getByTestId('basic-functionality-toggle'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('batch-account-balance-requests-toggle'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('batch-account-balance-requests-toggle'),
    );

    expect(setUseMultiAccountBalanceCheckerStub).toHaveBeenCalledTimes(1);
    expect(setUseMultiAccountBalanceCheckerStub.mock.calls[0][0]).toBe(false);
  });

  it('returns to the landing page from a sub-page header back button', () => {
    renderPrivacySettings();

    fireEvent.click(
      screen.getByTestId('onboarding-privacy-settings-item-privacy'),
    );
    fireEvent.click(
      screen.getByTestId('privacy-settings-sub-page-back-button'),
    );

    expect(screen.getByTestId('privacy-settings-landing')).toBeInTheDocument();
  });

  it('tracks onboarding analytics when toggling reused privacy settings', () => {
    const mockTrackEvent = jest.fn();

    renderPrivacySettings(undefined, mockTrackEvent);

    fireEvent.click(
      screen.getByTestId('onboarding-privacy-settings-item-privacy'),
    );
    fireEvent.click(
      screen.getByTestId('batch-account-balance-requests-toggle'),
    );

    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        use_multi_account_balance_checker: false,
      },
    });
  });

  it('opens the network edit menu when clicking the RPC URL on the network RPC page', () => {
    const store = configureMockStore([thunk])({
      metamask: {
        ...mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.LINEA_MAINNET },
          { chainId: CHAIN_IDS.SEPOLIA },
          { chainId: CHAIN_IDS.LINEA_SEPOLIA },
        ),
        use4ByteResolution: true,
        useTokenDetection: false,
        useCurrencyRateCheck: true,
        useMultiAccountBalanceChecker: true,
        ipfsGateway: 'test.link',
        useAddressBarEnsResolution: true,
        useTransactionSimulations: true,
        useExternalServices: true,
        useSafeChainsListValidation: true,
        useExternalNameSources: true,
        openSeaEnabled: true,
        useNftDetection: false,
        isIpfsGatewayEnabled: true,
        internalAccounts: {
          accounts: {},
          selectedAccount: '',
        },
      },
      appState: {
        externalServicesOnboardingToggleState: true,
        backupAndSyncOnboardingToggleState: false,
      },
    });

    renderPrivacySettings(store);

    fireEvent.click(
      screen.getByTestId('onboarding-privacy-settings-item-network-rpc'),
    );

    fireEvent.click(
      screen.getByTestId(`network-rpc-name-button-${CHAIN_IDS.MAINNET}`),
    );

    const actions = store.getActions();
    expect(actions).toContainEqual({
      type: 'SET_EDIT_NETWORK',
      payload: { chainId: CHAIN_IDS.MAINNET },
    });
    expect(actions).toContainEqual({
      type: 'TOGGLE_NETWORK_MENU',
      payload: undefined,
    });
  });
});
