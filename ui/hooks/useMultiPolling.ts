import { useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import stringify from 'fast-json-stable-stringify';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import { useSyncEqualityCheck } from './useSyncEqualityCheck';

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
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const pollingTokens = useRef<Map<string, string>>(new Map());
  const pollingInputs = useSyncEqualityCheck(usePollingOptions.input);

  // Pre-compute keys once per stable input instead of in loops
  const inputKeyMap = useMemo(() => {
    const map = new Map<string, PollingInput>();
    for (const input of pollingInputs) {
      map.set(stringify(input), input);
    }
    return map;
  }, [pollingInputs]);

  // Keep ref to latest stop function for use in unmount cleanup
  const stopPollingRef = useRef(usePollingOptions.stopPollingByPollingToken);
  stopPollingRef.current = usePollingOptions.stopPollingByPollingToken;

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      // stop all polling on dismount
      for (const token of pollingTokens.current.values()) {
        usePollingOptions.stopPollingByPollingToken(token);
      }
      isMounted.current = false;
      // Stop all polling on unmount - use ref to get latest function
      const tokens = pollingTokens.current;
      for (const token of tokens.values()) {
        stopPollingRef.current(token);
      }
      tokens.clear();
    };
  }, []);

  useEffect(() => {
    if (!completedOnboarding) {
      // don't start polling if onboarding is incomplete
      return;
    }

    // start new polls
    for (const [key, input] of inputKeyMap) {
      if (!pollingTokens.current.has(key)) {
        usePollingOptions.startPolling(input).then((token) => {
          if (isMounted.current) {
            pollingTokens.current.set(key, token);
          }
        });
      }
    }

    // stop existing polls
    for (const [inputKey, token] of pollingTokens.current.entries()) {
      if (!inputKeyMap.has(inputKey)) {
        usePollingOptions.stopPollingByPollingToken(token);
        pollingTokens.current.delete(inputKey);
      }
    }
  }, [
    inputKeyMap,
    usePollingOptions.startPolling,
    usePollingOptions.stopPollingByPollingToken,
    completedOnboarding,
  ]);
};

export default useMultiPolling;
