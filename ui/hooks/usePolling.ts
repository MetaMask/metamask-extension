import { useEffect, useRef } from 'react';

const usePolling = (
  callback: (pollingToken: string) => (pollingToken: string) => void,
  startPollingByNetworkClientId: (
    networkClientId: string,
    options: any,
  ) => string,
  stopPollingByPollingToken: (pollingToken: string) => void,
  networkClientId: string,
  options = {},
) => {
  const pollTokenRef = useRef<null | string>(null);
  useEffect(() => {
    // Start polling when the component mounts
    pollTokenRef.current = startPollingByNetworkClientId(
      networkClientId,
      options,
    );
    // eslint-disable-next-line node/callback-return
    const cleanup = callback(pollTokenRef.current);
    // Return a cleanup function to stop polling when the component unmounts
    return () => {
      if (pollTokenRef.current) {
        stopPollingByPollingToken(pollTokenRef.current);
        cleanup(pollTokenRef.current);
      }
    };
  }, [
    callback,
    startPollingByNetworkClientId,
    stopPollingByPollingToken,
    networkClientId,
    options,
  ]);
};

export default usePolling;
