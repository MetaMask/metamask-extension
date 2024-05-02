import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectParticipateInMetaMetrics,
  selectIsSignedIn,
} from '../../selectors/metamask-notifications/authentication';
import { selectIsProfileSyncingEnabled } from '../../selectors/metamask-notifications/profile-syncing';
import {
  performSignOut,
  performSignIn,
  setParticipateInMetaMetrics,
  showLoadingIndication,
  hideLoadingIndication,
} from '../../store/actions';

/**
 * Provides a hook to enable MetaMetrics tracking.
 * This hook handles user sign-in if not already signed in and sets participation in MetaMetrics to true.
 *
 * @returns An object containing the `enableMetametrics` function, a `loading` boolean indicating the operation status, and an `error` string for error messages.
 */
export function useEnableMetametrics(): {
  enableMetametrics: () => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();
  const isUserSignedIn = useSelector(selectIsSignedIn);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const enableMetametrics = useCallback(async () => {
    setLoading(true);
    showLoadingIndication();
    setError(null);

    try {
      if (!isUserSignedIn) {
        await dispatch(performSignIn());
      }

      await dispatch(setParticipateInMetaMetrics(true));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      hideLoadingIndication();
    }

    setLoading(false);
    hideLoadingIndication();
  }, [dispatch, isUserSignedIn]);

  return {
    enableMetametrics,
    loading,
    error,
  };
}

/**
 * Provides a hook to disable MetaMetrics tracking.
 * This hook handles user sign-out if profile syncing is not enabled and sets participation in MetaMetrics to false.
 *
 * @returns An object containing the `disableMetametrics` function, a `loading` boolean indicating the operation status, and an `error` string for error messages.
 */
export function useDisableMetametrics(): {
  disableMetametrics: () => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const disableMetametrics = useCallback(async () => {
    setLoading(true);
    showLoadingIndication();
    setError(null);

    try {
      if (!isProfileSyncingEnabled) {
        await dispatch(performSignOut());
      }

      await dispatch(setParticipateInMetaMetrics(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      hideLoadingIndication();
    }

    setLoading(false);
    hideLoadingIndication();
  }, [dispatch, isProfileSyncingEnabled]);

  return {
    disableMetametrics,
    loading,
    error,
  };
}

/**
 * Provides a hook to check if MetaMetrics tracking is enabled.
 *
 * @returns An object containing a boolean `isMetametricsEnabled` that indicates whether MetaMetrics is currently enabled.
 */
export function useIsMetametricsEnabled(): {
  isMetametricsEnabled: boolean;
} {
  const isParticipateInMetaMetrics = useSelector(
    selectParticipateInMetaMetrics,
  );

  return {
    isMetametricsEnabled: isParticipateInMetaMetrics,
  };
}
