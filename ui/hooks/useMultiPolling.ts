import { useEffect, useRef } from 'react';

type UseMultiPollingOptions<PollingInput> = {
  startPolling: (input: PollingInput) => Promise<string>;
  stopPollingByPollingToken: (pollingToken: string) => void;
  input: PollingInput[];
};

// A hook that manages multiple polling loops of a polling controller.
// Callers provide an array of inputs, and the hook manages starting
// and stopping polling loops for each input.
const useMultiPolling = <PollingInput>(
  usePollingOptions: UseMultiPollingOptions<PollingInput>,
) => {
  const pollingTokens = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    // start new polls
    for (const input of usePollingOptions.input) {
      const key = JSON.stringify(input);
      if (!pollingTokens.current.has(key)) {
        usePollingOptions
          .startPolling(input)
          .then((token) => pollingTokens.current.set(key, token));
      }
    }

    // stop existing polls
    for (const [inputKey, token] of pollingTokens.current.entries()) {
      const exists = usePollingOptions.input.some(
        (i) => inputKey === JSON.stringify(i),
      );

      if (!exists) {
        usePollingOptions.stopPollingByPollingToken(token);
        pollingTokens.current.delete(inputKey);
      }
    }
    // This effect will only run if a `usePollingOptions.input` array with a new reference is passed in as a prop.
  }, [usePollingOptions.input]);

  // stop all polling on dismount
  useEffect(() => {
    return () => {
      for (const token of pollingTokens.current.values()) {
        usePollingOptions.stopPollingByPollingToken(token);
      }
      pollingTokens.current.clear();
    };
  }, []);
};

export default useMultiPolling;
