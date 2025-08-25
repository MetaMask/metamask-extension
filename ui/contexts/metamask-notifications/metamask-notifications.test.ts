import { waitFor } from '@testing-library/react';
import * as ReactRedux from 'react-redux';
import * as NotificationHooks from '../../hooks/metamask-notifications/useNotifications';
import * as NotificationsSelectors from '../../selectors/metamask-notifications/metamask-notifications';
import * as Selectors from '../../selectors/selectors';
import * as MetamaskDucks from '../../ducks/metamask/metamask';
import * as AuthenticationSelectors from '../../selectors/identity/authentication';
import * as StorageHelpers from '../../../shared/lib/storage-helpers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import {
  useBasicFunctionalityDisableEffect,
  useEnableNotificationsByDefaultEffect,
  useFetchInitialNotificationsEffect,
} from './metamask-notifications'; // Adjust path as needed

describe('useBasicFunctionalityDisableEffect', () => {
  const arrangeHooks = () => {
    const mockDisableNotifications = jest.fn();
    const mockListNotifications = jest.fn();

    const mockUseDisableNotifications = jest.spyOn(
      NotificationHooks,
      'useDisableNotifications',
    );
    const mockUseListNotifications = jest.spyOn(
      NotificationHooks,
      'useListNotifications',
    );

    mockUseDisableNotifications.mockReturnValue({
      disableNotifications: mockDisableNotifications,
      error: null,
    });

    mockUseListNotifications.mockReturnValue({
      listNotifications: mockListNotifications,
      notificationsData: [],
      isLoading: false,
      error: undefined,
    });

    return {
      disableNotifications: mockDisableNotifications,
      listNotifications: mockListNotifications,
      mockUseDisableNotifications,
      mockUseListNotifications,
    };
  };

  const arrangeSelectors = () => {
    const mockGetUseExternalServices = jest
      .spyOn(Selectors, 'getUseExternalServices')
      .mockReturnValue(true);

    const mockIsNotifsEnabled = jest
      .spyOn(NotificationsSelectors, 'selectIsMetamaskNotificationsEnabled')
      .mockReturnValue(true);

    return {
      mockGetUseExternalServices,
      mockIsNotifsEnabled,
    };
  };

  const arrange = () => {
    return {
      hooks: arrangeHooks(),
      selectors: arrangeSelectors(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should disable notifications when basic functionality is disabled and notifications are enabled', async () => {
    const mocks = arrange();
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(false);
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);

    renderHookWithProvider(() => useBasicFunctionalityDisableEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.disableNotifications).toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).toHaveBeenCalled();
    });
  });

  it('should not disable notifications when basic functionality is enabled', async () => {
    const mocks = arrange();
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);

    renderHookWithProvider(() => useBasicFunctionalityDisableEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.disableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should not disable notifications when notifications are already disabled', async () => {
    const mocks = arrange();
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(false);
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(false);

    renderHookWithProvider(() => useBasicFunctionalityDisableEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.disableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should handle errors gracefully', async () => {
    const mocks = arrange();
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(false);
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);
    mocks.hooks.disableNotifications.mockRejectedValueOnce(
      new Error('Disable failed'),
    );

    renderHookWithProvider(() => useBasicFunctionalityDisableEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.disableNotifications).toHaveBeenCalled();
    });

    expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
  });

  it('should re-run effect when dependencies change', async () => {
    const mocks = arrange();

    // Mocking useSelector so it does not memoize the selectors passed in.
    const originalUseSelector = ReactRedux.useSelector;
    jest.spyOn(ReactRedux, 'useSelector').mockImplementation((selector) => {
      // Ensure the selector input is a new reference
      const wrappedSelector = (state: unknown) => selector(state);
      return originalUseSelector(wrappedSelector);
    });

    // First render - conditions not met
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);

    const { rerender } = renderHookWithProvider(
      () => useBasicFunctionalityDisableEffect(),
      {},
    );

    // Second render - conditions met
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(false);
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);

    rerender();

    await waitFor(() => {
      expect(mocks.hooks.disableNotifications).toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).toHaveBeenCalled();
    });
  });
});

describe('useFetchInitialNotificationsEffect', () => {
  const arrangeHooks = () => {
    const mockEnableNotifications = jest.fn();
    const mockListNotifications = jest.fn();

    const mockUseEnableNotifications = jest.spyOn(
      NotificationHooks,
      'useEnableNotifications',
    );
    const mockUseListNotifications = jest.spyOn(
      NotificationHooks,
      'useListNotifications',
    );

    mockUseEnableNotifications.mockReturnValue({
      enableNotifications: mockEnableNotifications,
      error: null,
    });

    mockUseListNotifications.mockReturnValue({
      listNotifications: mockListNotifications,
      notificationsData: [],
      isLoading: false,
      error: undefined,
    });

    return {
      enableNotifications: mockEnableNotifications,
      listNotifications: mockListNotifications,
      mockUseEnableNotifications,
      mockUseListNotifications,
    };
  };

  const arrangeSelectors = () => {
    const mockIsNotifsEnabled = jest
      .spyOn(NotificationsSelectors, 'selectIsMetamaskNotificationsEnabled')
      .mockReturnValue(true);

    const mockGetUseExternalServices = jest
      .spyOn(Selectors, 'getUseExternalServices')
      .mockReturnValue(true);

    const mockGetIsUnlocked = jest
      .spyOn(MetamaskDucks, 'getIsUnlocked')
      .mockReturnValue(true);

    const mockSelectIsSignedIn = jest
      .spyOn(AuthenticationSelectors, 'selectIsSignedIn')
      .mockReturnValue(true);

    return {
      mockIsNotifsEnabled,
      mockGetUseExternalServices,
      mockGetIsUnlocked,
      mockSelectIsSignedIn,
    };
  };

  const arrange = () => {
    const mockGetStorageItem = jest
      .spyOn(StorageHelpers, 'getStorageItem')
      .mockResolvedValue(undefined);
    const mockSetStorageItem = jest.spyOn(StorageHelpers, 'setStorageItem');

    return {
      hooks: arrangeHooks(),
      selectors: arrangeSelectors(),
      helpers: {
        mockGetStorageItem,
        mockSetStorageItem,
      },
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should enable and fetch notifications when all conditions are met', async () => {
    const mocks = arrange();
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(true);

    renderHookWithProvider(() => useFetchInitialNotificationsEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).toHaveBeenCalled();
    });
  });

  it('should not enable notifications if resubscription has not expired', async () => {
    const mocks = arrange();
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(true);

    // Has not expired
    mocks.helpers.mockGetStorageItem.mockResolvedValue(Date.now() + 1000);

    renderHookWithProvider(() => useFetchInitialNotificationsEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).toHaveBeenCalled();
    });
  });

  it('should not fetch notifications when basic functionality is disabled', async () => {
    const mocks = arrange();
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(false);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(true);

    renderHookWithProvider(() => useFetchInitialNotificationsEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should not fetch notifications when notifications are disabled', async () => {
    const mocks = arrange();
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(false);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(true);

    renderHookWithProvider(() => useFetchInitialNotificationsEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should not fetch notifications when user is not signed in', async () => {
    const mocks = arrange();
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(false);

    renderHookWithProvider(() => useFetchInitialNotificationsEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should not fetch notifications when wallet is locked', async () => {
    const mocks = arrange();
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(false);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(true);

    renderHookWithProvider(() => useFetchInitialNotificationsEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should handle errors gracefully', async () => {
    const mocks = arrange();
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(true);
    mocks.hooks.enableNotifications.mockRejectedValueOnce(
      new Error('Enable failed'),
    );

    renderHookWithProvider(() => useFetchInitialNotificationsEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).toHaveBeenCalled();
    });
    // Should not throw error
  });

  it('should handle listNotifications error gracefully', async () => {
    const mocks = arrange();
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(true);
    mocks.hooks.listNotifications.mockRejectedValueOnce(
      new Error('List failed'),
    );

    renderHookWithProvider(() => useFetchInitialNotificationsEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).toHaveBeenCalled();
    });
    // Should not throw error
  });

  it('should re-run effect when dependencies change', async () => {
    const mocks = arrange();

    // Mocking useSelector so it does not memoize the selectors passed in.
    const originalUseSelector = ReactRedux.useSelector;
    jest.spyOn(ReactRedux, 'useSelector').mockImplementation((selector) => {
      // Ensure the selector input is a new reference
      const wrappedSelector = (state: unknown) => selector(state);
      return originalUseSelector(wrappedSelector);
    });

    // First render - conditions not met
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(false);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(true);

    const { rerender } = renderHookWithProvider(
      () => useFetchInitialNotificationsEffect(),
      {},
    );

    // Second render - conditions met
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true);
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(true);
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    mocks.selectors.mockSelectIsSignedIn.mockReturnValue(true);

    rerender();

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).toHaveBeenCalled();
    });
  });
});

describe('useEnableNotificationsByDefaultEffect', () => {
  const arrangeHooks = () => {
    const mockEnableNotifications = jest.fn();
    const mockListNotifications = jest.fn();

    const mockUseEnableNotifications = jest.spyOn(
      NotificationHooks,
      'useEnableNotifications',
    );
    const mockUseListNotifications = jest.spyOn(
      NotificationHooks,
      'useListNotifications',
    );

    mockUseEnableNotifications.mockReturnValue({
      enableNotifications: mockEnableNotifications,
      error: null,
    });

    mockUseListNotifications.mockReturnValue({
      listNotifications: mockListNotifications,
      notificationsData: [],
      isLoading: false,
      error: undefined,
    });

    return {
      enableNotifications: mockEnableNotifications,
      listNotifications: mockListNotifications,
      mockUseEnableNotifications,
      mockUseListNotifications,
    };
  };

  const arrangeSelectors = () => {
    const mockIsNotifsEnabled = jest
      .spyOn(NotificationsSelectors, 'selectIsMetamaskNotificationsEnabled')
      .mockReturnValue(false);

    const mockGetUseExternalServices = jest
      .spyOn(Selectors, 'getUseExternalServices')
      .mockReturnValue(true);

    const mockGetIsUnlocked = jest
      .spyOn(MetamaskDucks, 'getIsUnlocked')
      .mockReturnValue(true);

    const mockGetIsNotificationEnabledByDefaultFeatureFlag = jest
      .spyOn(
        NotificationsSelectors,
        'getIsNotificationEnabledByDefaultFeatureFlag',
      )
      .mockReturnValue(true);

    return {
      mockIsNotifsEnabled,
      mockGetUseExternalServices,
      mockGetIsUnlocked,
      mockGetIsNotificationEnabledByDefaultFeatureFlag,
    };
  };

  const arrange = () => {
    const mockGetStorageItem = jest
      .spyOn(StorageHelpers, 'getStorageItem')
      .mockResolvedValue(undefined);

    const mockSetStorageItem = jest.spyOn(StorageHelpers, 'setStorageItem');

    return {
      hooks: arrangeHooks(),
      selectors: arrangeSelectors(),
      helpers: {
        mockGetStorageItem,
        mockSetStorageItem,
      },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enable notifications by default when all conditions are met and user has not turned off notifications', async () => {
    const mocks = arrange();

    renderHookWithProvider(() => useEnableNotificationsByDefaultEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).toHaveBeenCalled();
    });
  });

  it('should not enable notifications when notifications are already enabled', async () => {
    const mocks = arrange();
    mocks.selectors.mockIsNotifsEnabled.mockReturnValue(true); // Already enabled

    renderHookWithProvider(() => useEnableNotificationsByDefaultEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should not enable notifications when basic functionality is disabled', async () => {
    const mocks = arrange();
    mocks.selectors.mockGetUseExternalServices.mockReturnValue(false); // Basic functionality disabled

    renderHookWithProvider(() => useEnableNotificationsByDefaultEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should not enable notifications when wallet is locked', async () => {
    const mocks = arrange();
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(false); // Wallet locked

    renderHookWithProvider(() => useEnableNotificationsByDefaultEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should not enable notifications when feature flag is disabled', async () => {
    const mocks = arrange();
    mocks.selectors.mockGetIsNotificationEnabledByDefaultFeatureFlag.mockReturnValue(
      false,
    ); // Feature flag disabled

    renderHookWithProvider(() => useEnableNotificationsByDefaultEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should not enable notifications when user has previously turned off notifications', async () => {
    const mocks = arrange();
    mocks.helpers.mockGetStorageItem.mockResolvedValue(true); // User has turned off notifications

    renderHookWithProvider(() => useEnableNotificationsByDefaultEffect(), {});

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should handle errors gracefully when hasUserTurnedOffNotificationsOnce fails', async () => {
    const mocks = arrange();
    mocks.helpers.mockGetStorageItem.mockRejectedValueOnce(
      new Error('Storage failed'),
    );

    renderHookWithProvider(() => useEnableNotificationsByDefaultEffect(), {});

    await waitFor(() => {
      // Should not call enable/list notifications when storage check fails
      expect(mocks.hooks.enableNotifications).not.toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).not.toHaveBeenCalled();
    });
  });

  it('should re-run effect when dependencies change', async () => {
    const mocks = arrange();

    // Mocking useSelector so it does not memoize the selectors passed in.
    const originalUseSelector = ReactRedux.useSelector;
    jest.spyOn(ReactRedux, 'useSelector').mockImplementation((selector) => {
      // Ensure the selector input is a new reference
      const wrappedSelector = (state: unknown) => selector(state);
      return originalUseSelector(wrappedSelector);
    });

    // First render - conditions not met (wallet locked)
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(false);

    const { rerender } = renderHookWithProvider(
      () => useEnableNotificationsByDefaultEffect(),
      {},
    );

    // Second render - conditions met (notifications disabled and wallet is unlocked)
    mocks.selectors.mockGetIsUnlocked.mockReturnValue(true);
    rerender();

    await waitFor(() => {
      expect(mocks.hooks.enableNotifications).toHaveBeenCalled();
      expect(mocks.hooks.listNotifications).toHaveBeenCalled();
    });
  });
});
