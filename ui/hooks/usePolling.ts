import { useEffect, useRef } from 'react';
import { useSyncEqualityCheck } from './useSyncEqualityCheck';

type UsePollingOptions<PollingInput> = {
  callback?: (pollingToken: string) => (pollingToken: string) => void;
  startPolling: (input: PollingInput) => Promise<string>;
  stopPollingByPollingToken: (pollingToken: string) => void;
  input: PollingInput;
  enabled?: boolean;
};

const usePolling = <PollingInput>(
  usePollingOptions: UsePollingOptions<PollingInput>,
) => {
  const pollTokenRef = useRef<null | string>(null);
  const cleanupRef = useRef<null | ((pollingToken: string) => void)>(null);
  const pollingInput = useSyncEqualityCheck(usePollingOptions.input);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = () => {
      if (pollTokenRef.current) {
        usePollingOptions.stopPollingByPollingToken(pollTokenRef.current);
        cleanupRef.current?.(pollTokenRef.current);
        pollTokenRef.current = null;
        cleanupRef.current = null;
      }
    };

    if (usePollingOptions.enabled === false) {
      // Stop polling if it was previously enabled
      if (pollTokenRef.current) {
        cleanup();
      }
      return () => {
        // noop
      };
    }

    // Start polling when the component mounts
    usePollingOptions.startPolling(pollingInput).then((pollToken) => {
      pollTokenRef.current = pollToken;
      cleanupRef.current = usePollingOptions.callback?.(pollToken) ?? null;
      if (!isMounted.current) {
        cleanup();
      }
    });

    // Return a cleanup function to stop polling when the component unmounts or dependencies change
    return cleanup;
  }, [
    pollingInput,
    usePollingOptions.enabled,
    usePollingOptions.stopPollingByPollingToken,
  ]);
};

export default usePolling;
