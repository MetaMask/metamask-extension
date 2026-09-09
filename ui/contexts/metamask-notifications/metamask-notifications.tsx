import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import type { INotification } from '@metamask/notification-services-controller/notification-services';
import {
  useDisableNotifications,
  useEnableNotifications,
  useListNotifications,
} from '../../hooks/metamask-notifications/useNotifications';
import {
  getIsNotificationEnabledByDefaultFeatureFlag,
  selectIsMetamaskNotificationsEnabled,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { getNotificationPreferences } from '../../store/actions';
import { getUseExternalServices } from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import { useDispatch } from '../../store/hooks';

import {
  hasNotificationSubscriptionExpired,
  hasUserTurnedOffNotificationsOnce,
} from './notification-storage-keys';

type MetamaskNotificationsContextType = {
  listNotifications: () => void;
  notificationsData?: INotification[];
  isLoading: boolean;
  error?: unknown;
  traceLifecycle: {
    isPending: boolean;
    error?: unknown;
  };
};

const MetamaskNotificationsContext = createContext<
  MetamaskNotificationsContextType | undefined
>(undefined);

export const useMetamaskNotificationsContext = () => {
  const context = useContext(MetamaskNotificationsContext);
  if (!context) {
    throw new Error(
      'useNotificationsContext must be used within a MetamaskNotificationsProvider',
    );
  }
  return context;
};

const useDisableAndRefresh = () => {
  const { disableNotifications } = useDisableNotifications();
  const { listNotifications } = useListNotifications();
  return useCallback(async () => {
    await disableNotifications();
    await listNotifications();
  }, [disableNotifications, listNotifications]);
};

const useEnableAndRefresh = () => {
  const { enableNotifications } = useEnableNotifications();
  const { listNotifications } = useListNotifications();
  return useCallback(
    async (shouldEnable = true) => {
      shouldEnable && (await enableNotifications());
      await listNotifications();
    },
    [enableNotifications, listNotifications],
  );
};

export function useBasicFunctionalityDisableEffect() {
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const disableAndRefresh = useDisableAndRefresh();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (cancelled) {
          return;
        }
        if (!isBasicFunctionalityEnabled && isNotificationsEnabled) {
          await disableAndRefresh();
        }
      } catch {
        // Do nothing
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [disableAndRefresh, isBasicFunctionalityEnabled, isNotificationsEnabled]);
}

export function useFetchInitialNotificationsEffect() {
  const dispatch = useDispatch();
  const isNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isUnlocked = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);
  const shouldFetchNotifications =
    Boolean(isNotificationsEnabled) && Boolean(isSignedIn);
  const shouldRunInitialFetch =
    isBasicFunctionalityEnabled && shouldFetchNotifications && isUnlocked;
  const enableAndRefresh = useEnableAndRefresh();
  const [hasCompletedInitialFetch, setHasCompletedInitialFetch] =
    useState(false);
  const [traceError, setTraceError] = useState<unknown>();

  /* eslint-disable react-hooks/set-state-in-effect -- Reset trace-only state
   * while ineligible so a later enable/sign-in activation starts pending. */
  useEffect(() => {
    if (!shouldRunInitialFetch) {
      setHasCompletedInitialFetch(false);
      setTraceError(undefined);
    }
  }, [shouldRunInitialFetch]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    let cancelled = false;

    const shouldEnableNotificationsOnStartup = async () => {
      if (await hasNotificationSubscriptionExpired()) {
        return true;
      }

      try {
        const preferences = (await dispatch(
          getNotificationPreferences(),
        )) as unknown;

        return preferences === null || preferences === undefined;
      } catch {
        return false;
      }
    };

    const run = async () => {
      try {
        if (cancelled) {
          return;
        }
        if (shouldRunInitialFetch) {
          setTraceError(undefined);
          await enableAndRefresh(await shouldEnableNotificationsOnStartup());
        }
      } catch (error) {
        if (!cancelled) {
          setTraceError(error);
        }
      } finally {
        if (!cancelled && shouldRunInitialFetch) {
          setHasCompletedInitialFetch(true);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    shouldFetchNotifications,
    isBasicFunctionalityEnabled,
    isUnlocked,
    shouldRunInitialFetch,
    dispatch,
    enableAndRefresh,
  ]);

  const clearTraceError = useCallback(() => setTraceError(undefined), []);

  return {
    isPending: shouldRunInitialFetch && !hasCompletedInitialFetch,
    error: traceError,
    clearTraceError,
  };
}

export function useEnableNotificationsByDefaultEffect() {
  const isNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isUnlocked = useSelector(getIsUnlocked);
  const isNotificationsEnabledByDefaultFeatureFlag = useSelector(
    getIsNotificationEnabledByDefaultFeatureFlag,
  );
  const enableAndRefresh = useEnableAndRefresh();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (cancelled) {
          return;
        }
        if (
          !isNotificationsEnabled &&
          isBasicFunctionalityEnabled &&
          isUnlocked &&
          isNotificationsEnabledByDefaultFeatureFlag
        ) {
          if (!(await hasUserTurnedOffNotificationsOnce())) {
            if (cancelled) {
              return;
            }
            await enableAndRefresh();
          }
        }
      } catch {
        // Do nothing
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    enableAndRefresh,
    isBasicFunctionalityEnabled,
    isNotificationsEnabled,
    isNotificationsEnabledByDefaultFeatureFlag,
    isUnlocked,
  ]);
}

export const MetamaskNotificationsProvider = ({
  children,
}: React.PropsWithChildren<unknown>) => {
  const { listNotifications, notificationsData, isLoading, error } =
    useListNotifications();

  // Basic functionality effect
  useBasicFunctionalityDisableEffect();

  // Update subscriptions and fetch notifications
  const {
    isPending: isInitialFetchPending,
    error: initialFetchError,
    clearTraceError,
  } = useFetchInitialNotificationsEffect();

  // Enable notifications by default for users
  useEnableNotificationsByDefaultEffect();

  useEffect(() => {
    if (notificationsData !== undefined) {
      clearTraceError();
    }
  }, [clearTraceError, notificationsData]);

  const listNotificationsCallback = useCallback(() => {
    listNotifications();
  }, [listNotifications]);

  const contextValue = useMemo(
    () => ({
      listNotifications: listNotificationsCallback,
      notificationsData,
      isLoading,
      error,
      traceLifecycle: {
        isPending: isInitialFetchPending,
        error: initialFetchError,
      },
    }),
    [
      listNotificationsCallback,
      notificationsData,
      isLoading,
      error,
      initialFetchError,
      isInitialFetchPending,
    ],
  );

  return (
    <MetamaskNotificationsContext.Provider value={contextValue}>
      {children}
    </MetamaskNotificationsContext.Provider>
  );
};
