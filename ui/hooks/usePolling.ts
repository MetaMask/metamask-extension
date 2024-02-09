import { useEffect, useRef } from 'react';

type UsePollingOptions = {
  // callback?: (pollingToken: string) => (pollingToken: string) => void;
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
  useEffect(() => {
    // Start polling when the component mounts
    usePollingOptions.startPollingByNetworkClientId(
      usePollingOptions.networkClientId,
      usePollingOptions.options,
    ).then((pollToken) => {
      pollTokenRef.current = pollToken
      // const cleanup = usePollingOptions.callback?.(pollTokenRef.current);
    });

    // eslint-disable-next-line node/callback-return
    // Return a cleanup function to stop polling when the component unmounts
    return () => {
      console.log('jiexi usePolling exit', pollTokenRef, pollTokenRef.current)
      if (pollTokenRef.current) {
        usePollingOptions.stopPollingByPollingToken(pollTokenRef.current);
        // cleanup?.(pollTokenRef.current);
      }
    };
  }, []);
};

export default usePolling;
