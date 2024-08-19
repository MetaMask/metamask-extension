import { useEffect, useRef } from 'react';

type UsePollingOptions = {
  callback?: (pollingToken: string) => (pollingToken: string) => void;
  startPollingByNetworkClientId: (
    networkClientId: string,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any,
  ) => Promise<string>;
  stopPollingByPollingToken: (pollingToken: string) => void;
  networkClientId: string;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any;
  enabled?: boolean;
};

const usePolling = (usePollingOptions: UsePollingOptions) => {
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
      .startPollingByNetworkClientId(
        usePollingOptions.networkClientId,
        usePollingOptions.options,
      )
      .then((pollToken) => {
        pollTokenRef.current = pollToken;
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
    usePollingOptions.networkClientId,
    usePollingOptions.options &&
      JSON.stringify(
        usePollingOptions.options,
        Object.keys(usePollingOptions.options).sort(),
      ),
    usePollingOptions.enabled,
  ]);
};

export default usePolling;
