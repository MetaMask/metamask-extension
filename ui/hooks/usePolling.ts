import { useEffect, useRef } from 'react';

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

  const prevPollingInputStringified = useRef<string | null>(null);
  const hasPollingInputChanged =
    JSON.stringify(usePollingOptions.input) !==
    prevPollingInputStringified.current;

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (usePollingOptions.enabled === false || !hasPollingInputChanged) {
      return () => {
        // noop
      };
    }

    const cleanup = () => {
      if (pollTokenRef.current) {
        usePollingOptions.stopPollingByPollingToken(pollTokenRef.current);
        cleanupRef.current?.(pollTokenRef.current);
      }
    };

    // Start polling when the component mounts
    usePollingOptions
      .startPolling(usePollingOptions.input)
      .then((pollToken) => {
        pollTokenRef.current = pollToken;
        cleanupRef.current = usePollingOptions.callback?.(pollToken) ?? null;
        if (!isMounted.current) {
          cleanup();
        }
      });

    prevPollingInputStringified.current = JSON.stringify(
      usePollingOptions.input,
    );

    // Return a cleanup function to stop polling when the component unmounts
    return () => {
      prevPollingInputStringified.current = null;
      cleanup();
    };
  }, [
    usePollingOptions.input,
    hasPollingInputChanged,
    usePollingOptions.enabled,
  ]);
};

export default usePolling;
