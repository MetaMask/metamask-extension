import { useEffect, useRef } from 'react';
import { useSyncEqualityCheck } from './useSyncEqualityCheck';

type UsePollingOptions<PollingInput> = {
  startPolling: (input: PollingInput) => Promise<string>;
  stopPollingByPollingToken: (pollingToken: string) => void;
  input: PollingInput;
  enabled?: boolean;
};

const usePolling = <PollingInput>(
  usePollingOptions: UsePollingOptions<PollingInput>,
) => {
  const pollTokenRef = useRef<null | string>(null);
  const pollingInput = useSyncEqualityCheck(usePollingOptions.input);

  // Track effect call generation to handle race conditions with pending promises
  const callIdRef = useRef(0);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    callIdRef.current += 1;
    const currentCallId = callIdRef.current;

    if (usePollingOptions.enabled === false) {
      cleanup();
        // noop
      };
    }

    const cleanup = () => {
      if (pollTokenRef.current) {
        usePollingOptions.stopPollingByPollingToken(pollTokenRef.current);
        pollTokenRef.current = null;
      }
    };

    // Start polling when the component mounts
    usePollingOptions.startPolling(pollingInput).then((pollToken) => {
      // Check if this is still the current call (handles race conditions)
      if (currentCallId !== callIdRef.current) {
        // Stale call - stop the poll immediately to prevent orphaned tokens
        usePollingOptions.stopPollingByPollingToken(pollToken);
        return;
      }

      pollTokenRef.current = pollToken;
      if (!isMounted.current) {
        cleanup();
      }
    });

    // Return a cleanup function to stop polling when the component unmounts or dependencies change
    return cleanup;
  }, [
    pollingInput,
    usePollingOptions.enabled,
    usePollingOptions.startPolling,
    usePollingOptions.stopPollingByPollingToken,
  ]);
};

export default usePolling;
