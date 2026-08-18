import { useEffect } from 'react';
import { isPasskeyPRFSupported } from '../../shared/lib/passkey';

/**
 * Checks whether the browser supports PRF-backed passkeys and invokes the
 * callback when setup must be skipped.
 *
 * SECURITY: PRF is required for passkey setup. Never fall back to
 * userHandle-based key derivation.
 *
 * @param onUnsupported - Called when PRF is unavailable or capability
 * detection fails.
 */
export function usePasskeyPRFSupport(onUnsupported: () => void): void {
  useEffect(() => {
    let isCancelled = false;

    const checkPrfSupport = async () => {
      let prfSupported = false;
      try {
        prfSupported = (await isPasskeyPRFSupported()) === true;
      } catch {
        // Treat capability detection failures as unsupported for security.
      }

      if (isCancelled || prfSupported) {
        return;
      }

      onUnsupported();
    };

    checkPrfSupport();

    return () => {
      isCancelled = true;
    };
  }, [onUnsupported]);
}
