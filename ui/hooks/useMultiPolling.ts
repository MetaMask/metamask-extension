import { useEffect, useRef, useState } from 'react';

type UseMultiPollingOptions<PollingInput> = {
  startPolling: (input: PollingInput) => Promise<string>;
  stopPollingByPollingToken: (pollingToken: string) => void;
  input: PollingInput[];
};

const useMultiPolling = <PollingInput>(
  usePollingOptions: UseMultiPollingOptions<PollingInput>,
) => {
  // mapping from input to token
  const [polls, setPolls] = useState(new Map());

  useEffect(() => {
    // start new polls
    for (const input of usePollingOptions.input) {
      const key = JSON.stringify(input);
      if (!polls.has(key)) {
        usePollingOptions.startPolling(input).then(token =>
          setPolls((prevPolls) => new Map(prevPolls).set(key, token))
        );
      }
    }

    // stop existing polls
    for (const [inputKey, token] of polls.entries()) {
      const exists = usePollingOptions.input.some(
        (i) => inputKey === JSON.stringify(i),
      );

      if (!exists) {
        usePollingOptions.stopPollingByPollingToken(token);
        setPolls(prevPolls => {
          const newPolls = new Map(prevPolls);
          newPolls.delete(inputKey);
          return newPolls;
        })
      }
    }
  }, [usePollingOptions.input && JSON.stringify(usePollingOptions.input)]);

  // cleanup
  useEffect(() => {
    return () => {
      // This is the cleanup function that runs when the component unmounts
      for (const token of polls.values()) {
        usePollingOptions.stopPollingByPollingToken(token);
      }
    };
  }, []);
};

export default useMultiPolling;
