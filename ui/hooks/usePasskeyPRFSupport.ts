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
export type UsePasskeyPRFSupportOptions = {
  enabled?: boolean;
  onUnsupported: () => void;
};

export function usePasskeyPRFSupport({
  enabled = true,
  onUnsupported,
}: UsePasskeyPRFSupportOptions): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let isCancelled = false;

    const checkPrfSupport = async () => {
      let prfSupported: boolean | undefined;
      try {
        prfSupported = await isPasskeyPRFSupported();
      } catch {
        // Capability detection is unavailable; allow the ceremony to decide.
      }

      if (isCancelled || prfSupported !== false) {
        return;
      }

      onUnsupported();
    };

    checkPrfSupport();

    return () => {
      isCancelled = true;
    };
  }, [enabled, onUnsupported]);
}
