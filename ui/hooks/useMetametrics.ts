import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import log from 'loglevel';
import {
  setParticipateInMetaMetrics,
  showLoadingIndication,
  hideLoadingIndication,
} from '../store/actions';

/**
 * Provides a hook to enable MetaMetrics tracking.
 * This hook handles sets participation in MetaMetrics to true.
 *
 * @returns An object containing the `enableMetametrics` function, a `loading` boolean indicating the operation status, and an `error` string for error messages.
 */
export function useEnableMetametrics(): {
  enableMetametrics: () => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const enableMetametrics = useCallback(async () => {
    setLoading(true);
    dispatch(showLoadingIndication());
    setError(null);

    try {
      await dispatch(setParticipateInMetaMetrics(true));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      log.error(e);
      throw e;
    } finally {
      setLoading(false);
      dispatch(hideLoadingIndication());
    }

    dispatch(hideLoadingIndication());
  }, [dispatch]);

  return {
    enableMetametrics,
    loading,
    error,
  };
}

/**
 * Provides a hook to disable MetaMetrics tracking.
 *
 * @returns An object containing the `disableMetametrics` function, a `loading` boolean indicating the operation status, and an `error` string for error messages.
 */
export function useDisableMetametrics(): {
  disableMetametrics: () => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const disableMetametrics = useCallback(async () => {
    setLoading(true);
    dispatch(showLoadingIndication());
    setError(null);

    try {
      await dispatch(setParticipateInMetaMetrics(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      throw e;
    } finally {
      setLoading(false);
      dispatch(hideLoadingIndication());
    }

    dispatch(hideLoadingIndication());
  }, [dispatch]);

  return {
    disableMetametrics,
    loading,
    error,
  };
}
