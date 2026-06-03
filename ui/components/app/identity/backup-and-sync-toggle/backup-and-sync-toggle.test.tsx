import React from 'react';
import * as Redux from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { MetamaskIdentityProvider } from '../../../../contexts/identity';
import * as useBackupAndSyncHook from '../../../../hooks/identity/useBackupAndSync/useBackupAndSync';
import { CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME } from '../../modals/identity';
import { showModal } from '../../../../store/actions';
import {
  onboardingToggleBackupAndSyncOff,
  onboardingToggleBackupAndSyncOn,
  onboardingToggleBasicFunctionalityOn,
} from '../../../../ducks/app/app';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  BackupAndSyncToggle,
  backupAndSyncToggleTestIds,
} from './backup-and-sync-toggle';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockStore = configureMockStore();
const initialStore = () => ({
  metamask: {
    isSignedIn: false,
    useExternalServices: true,
    isBackupAndSyncEnabled: true,
    participateInMetaMetrics: false,
    isBackupAndSyncUpdateLoading: false,
    keyrings: [],
  },
  appState: {
    externalServicesOnboardingToggleState: true,
    backupAndSyncOnboardingToggleState: true,
  },
});

describe('BackupAndSyncToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <Redux.Provider store={mockStore(initialStore())}>
        <MetamaskIdentityProvider>
          <BackupAndSyncToggle />
        </MetamaskIdentityProvider>
      </Redux.Provider>,
    );
    expect(
      getByTestId(backupAndSyncToggleTestIds.container),
    ).toBeInTheDocument();
  });

  it('tracks the toggle event', () => {
    const mockTrackEvent = jest.fn();
    const mockMetaMetricsContext = {
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    };
    const store = initialStore();

    store.metamask.isBackupAndSyncEnabled = true;
    arrangeMocks();

    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <BackupAndSyncToggle />
      </MetaMetricsContext.Provider>,
      mockStore(store),
    );

    fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));
    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: 'Settings',
      event: 'Settings Updated',
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_group: 'backup_and_sync',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_type: 'main',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        old_value: true,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        new_value: false,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        was_notifications_on: false,
      },
    });
  });

  it('enables backup and sync and all sub-features when the toggle is turned on and basic functionality is already on', async () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = false;

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncToggle />
      </Redux.Provider>,
    );

    fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));

    await waitFor(() => {
      expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
        BACKUPANDSYNC_FEATURES.main,
        true,
      );
    });

    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.accountSyncing,
      true,
    );
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.contactSyncing,
      true,
    );
  });

  it('opens the confirm modal when the toggle is turned on and basic functionality is off', async () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = false;
    store.metamask.useExternalServices = false;
    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();
    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncToggle />
      </Redux.Provider>,
    );
    fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));
    expect(setIsBackupAndSyncFeatureEnabledMock).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      showModal({
        name: CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
        enableBackupAndSync: expect.any(Function),
      }),
    );

    // The modal's enableBackupAndSync callback should re-enable basic
    // functionality (via toggleExternalServices, a thunk) and then enable B&S features.
    const modalAction = mockDispatch.mock.calls.find(
      (call) => call[0]?.type === 'UI_MODAL_OPEN',
    )?.[0];
    const enableCallback = modalAction.payload.enableBackupAndSync;

    const dispatchCallCountBefore = mockDispatch.mock.calls.length;
    await enableCallback();

    // toggleExternalServices is a thunk: each invocation returns a new function,
    // so assert by detecting a thunk dispatch happened during the callback.
    const dispatchedThunkAfterCallback = mockDispatch.mock.calls
      .slice(dispatchCallCountBefore)
      .some((call) => typeof call[0] === 'function');
    expect(dispatchedThunkAfterCallback).toBe(true);
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.main,
      true,
    );
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.accountSyncing,
      true,
    );
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.contactSyncing,
      true,
    );
  });

  it('disables all backup and sync features when basic functionality is disabled in settings', async () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = true;
    store.metamask.useExternalServices = false;

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncToggle />
      </Redux.Provider>,
    );

    await waitFor(() => {
      expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
        BACKUPANDSYNC_FEATURES.main,
        false,
      );
    });

    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.accountSyncing,
      false,
    );
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.contactSyncing,
      false,
    );
  });

  it('does not disable backup and sync in settings when only the onboarding basic functionality flag is off', async () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = true;
    store.metamask.useExternalServices = true;
    store.appState.externalServicesOnboardingToggleState = false;

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncToggle />
      </Redux.Provider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(setIsBackupAndSyncFeatureEnabledMock).not.toHaveBeenCalled();
  });

  it('disables all sub-features when manually turning off backup and sync in settings', async () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = true;

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncToggle />
      </Redux.Provider>,
    );

    fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));

    await waitFor(() => {
      expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
        BACKUPANDSYNC_FEATURES.main,
        false,
      );
    });

    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.accountSyncing,
      false,
    );
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.contactSyncing,
      false,
    );
  });

  describe('isOnboarding mode', () => {
    const noopMetaMetricsContext = {
      trackEvent: jest.fn(),
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    };

    const renderInOnboarding = (store: ReturnType<typeof initialStore>) =>
      render(
        <Redux.Provider store={mockStore(store)}>
          <MetaMetricsContext.Provider value={noopMetaMetricsContext}>
            <BackupAndSyncToggle isOnboarding />
          </MetaMetricsContext.Provider>
        </Redux.Provider>,
      );

    it('reads from the onboarding flag and writes the onboarding-off action when toggling off', () => {
      const store = initialStore();
      store.appState.backupAndSyncOnboardingToggleState = true;
      const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

      const { getByTestId } = renderInOnboarding(store);

      fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));

      // Never calls the controller during onboarding.
      expect(setIsBackupAndSyncFeatureEnabledMock).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        onboardingToggleBackupAndSyncOff(),
      );
    });

    it('writes the onboarding-on action when toggling on while onboarding basic functionality is on', () => {
      const store = initialStore();
      store.appState.backupAndSyncOnboardingToggleState = false;
      store.appState.externalServicesOnboardingToggleState = true;
      const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

      const { getByTestId } = renderInOnboarding(store);

      fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));

      expect(setIsBackupAndSyncFeatureEnabledMock).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        onboardingToggleBackupAndSyncOn(),
      );
    });

    it('opens the confirm modal when toggling on while onboarding basic functionality is off, and the callback dispatches only onboarding actions', async () => {
      const store = initialStore();
      store.appState.backupAndSyncOnboardingToggleState = false;
      store.appState.externalServicesOnboardingToggleState = false;
      const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

      const { getByTestId } = renderInOnboarding(store);

      fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));

      expect(setIsBackupAndSyncFeatureEnabledMock).not.toHaveBeenCalled();
      const modalAction = mockDispatch.mock.calls.find(
        (call) => call[0]?.type === 'UI_MODAL_OPEN',
      )?.[0];
      expect(modalAction).toBeDefined();
      expect(modalAction.payload.name).toBe(
        CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
      );

      const enableCallback = modalAction.payload.enableBackupAndSync;
      await enableCallback();

      expect(mockDispatch).toHaveBeenCalledWith(
        onboardingToggleBasicFunctionalityOn(),
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        onboardingToggleBackupAndSyncOn(),
      );
      expect(setIsBackupAndSyncFeatureEnabledMock).not.toHaveBeenCalled();
    });

    it('cascades onboarding basic-functionality off into onboarding backup-and-sync off without calling the controller', async () => {
      const store = initialStore();
      store.appState.backupAndSyncOnboardingToggleState = true;
      store.appState.externalServicesOnboardingToggleState = false;
      const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

      render(
        <Redux.Provider store={mockStore(store)}>
          <BackupAndSyncToggle isOnboarding />
        </Redux.Provider>,
      );

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          onboardingToggleBackupAndSyncOff(),
        );
      });

      expect(setIsBackupAndSyncFeatureEnabledMock).not.toHaveBeenCalled();
    });

    it('reflects the onboarding flag value in the toggle even if the controller state differs', () => {
      const store = initialStore();
      store.metamask.isBackupAndSyncEnabled = true;
      store.appState.backupAndSyncOnboardingToggleState = false;
      arrangeMocks();

      const { container } = render(
        <Redux.Provider store={mockStore(store)}>
          <BackupAndSyncToggle isOnboarding />
        </Redux.Provider>,
      );

      // ToggleButton applies `toggle-button--on` / `toggle-button--off` based on value.
      expect(container.querySelector('.toggle-button--off')).not.toBeNull();
      expect(container.querySelector('.toggle-button--on')).toBeNull();
    });

    it('does not show the controller loading preloader during onboarding', () => {
      const store = initialStore();
      store.metamask.isBackupAndSyncUpdateLoading = true;
      arrangeMocks();

      const { getByTestId } = render(
        <Redux.Provider store={mockStore(store)}>
          <BackupAndSyncToggle isOnboarding />
        </Redux.Provider>,
      );

      // Toggle remains rendered (preloader is hidden) during onboarding.
      expect(
        getByTestId(backupAndSyncToggleTestIds.toggleContainer),
      ).toBeInTheDocument();
    });
  });

  function arrangeMocks() {
    const setIsBackupAndSyncFeatureEnabledMock = jest.fn(() =>
      Promise.resolve(),
    );

    jest.spyOn(useBackupAndSyncHook, 'useBackupAndSync').mockReturnValue({
      setIsBackupAndSyncFeatureEnabled: setIsBackupAndSyncFeatureEnabledMock,
      error: null,
    });

    return {
      setIsBackupAndSyncFeatureEnabledMock,
    };
  }
});
