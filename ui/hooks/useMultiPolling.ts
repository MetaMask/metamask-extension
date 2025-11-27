import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
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

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      // stop all polling on dismount
      for (const token of pollingTokens.current.values()) {
        usePollingOptions.stopPollingByPollingToken(token);
      }
      isMounted.current = false;
      // Stop all polling on unmount - access refs at cleanup time
      for (const token of pollingTokens.current.values()) {
        usePollingOptions.stopPollingByPollingToken(token);
      }
    };
  }, []);

  useEffect(() => {
    if (!completedOnboarding) {
      // don't start polling if onboarding is incomplete
      return;
    }

    // start new polls
    for (const input of pollingInputs) {
      const key = JSON.stringify(input);
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
      const exists = pollingInputs.some(
        (i: PollingInput) => inputKey === JSON.stringify(i),
      );

      if (!exists) {
        usePollingOptions.stopPollingByPollingToken(token);
        pollingTokens.current.delete(inputKey);
      }
    }
  }, [
    pollingInputs,
    usePollingOptions.startPolling,
    usePollingOptions.stopPollingByPollingToken,
    completedOnboarding,
  ]);
};

export default useMultiPolling;
