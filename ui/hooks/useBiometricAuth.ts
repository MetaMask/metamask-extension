import { useState, useEffect, useCallback } from 'react';
import {
  isBiometricSupported,
  isBiometricEnrolled,
  enrollBiometric,
  authenticateBiometric,
  unenrollBiometric,
} from '../../app/scripts/lib/biometric-auth';

type BiometricState = {
  /** Whether the platform supports biometric auth (WebAuthn PRF) */
  isSupported: boolean;
  /** Whether the user has enrolled biometric login */
  isEnrolled: boolean;
  /** Whether a biometric operation is in progress */
  isLoading: boolean;
  /** Last error message, if any */
  error: string | null;
};

/**
 * Hook for biometric authentication on the unlock page.
 *
 * Checks support & enrollment on mount, exposes enroll/authenticate/unenroll.
 */
export function useBiometricAuth() {
  const [state, setState] = useState<BiometricState>({
    isSupported: false,
    isEnrolled: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const [supported, enrolled] = await Promise.all([
        isBiometricSupported(),
        isBiometricEnrolled(),
      ]);
      if (!cancelled) {
        setState({
          isSupported: supported,
          isEnrolled: enrolled,
          isLoading: false,
          error: null,
        });
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const enroll = useCallback(async (password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const success = await enrollBiometric(password);
      setState((prev) => ({
        ...prev,
        isEnrolled: success,
        isLoading: false,
        error: success ? null : 'Biometric enrollment failed',
      }));
      return success;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Enrollment failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, []);

  const authenticate = useCallback(async (): Promise<string | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const password = await authenticateBiometric();
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: password ? null : 'Biometric authentication failed',
      }));
      return password;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const unenroll = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    await unenrollBiometric();
    setState((prev) => ({
      ...prev,
      isEnrolled: false,
      isLoading: false,
      error: null,
    }));
  }, []);

  return {
    ...state,
    enroll,
    authenticate,
    unenroll,
  };
}
