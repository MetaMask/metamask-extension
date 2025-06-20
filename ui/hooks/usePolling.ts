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
  let isMounted = false;
  useEffect(() => {
    if (usePollingOptions.enabled === false) {
      return () => {
        // noop
      };
    }

    isMounted = true;

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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        cleanupRef.current = usePollingOptions.callback?.(pollToken) || null;
        if (!isMounted) {
          cleanup();
        }
      });

    // Return a cleanup function to stop polling when the component unmounts
    return () => {
      isMounted = false;
      cleanup();
    };
  }, [
    usePollingOptions.input && JSON.stringify(usePollingOptions.input),
    usePollingOptions.enabled,
  ]);
};

export default usePolling;
