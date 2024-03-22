import { useEffect, useRef } from 'react';

type UsePollingOptions = {
  callback?: (pollingToken: string) => (pollingToken: string) => void;
  startPollingByNetworkClientId: (
    networkClientId: string,
    options: any,
  ) => Promise<string>;
  stopPollingByPollingToken: (pollingToken: string) => void;
  networkClientId: string;
  options?: any;
};

const usePolling = (usePollingOptions: UsePollingOptions) => {
  const pollTokenRef = useRef<null | string>(null);
  const cleanupRef = useRef<null | ((pollingToken: string) => void)>(null);
  let isMounted = false;
  useEffect(() => {
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
  ]);
};

export default usePolling;
