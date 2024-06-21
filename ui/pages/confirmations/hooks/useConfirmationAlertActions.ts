import { useCallback } from 'react';

// This hook is responsible for processing confirmation actions.
// We will delegate to alternate confirmation type hooks which will process the action if the type matches.
const useConfirmationAlertActions = () => {
  // eslint-disable-next-line no-empty-function
  const processAction = useCallback((_actionKey: string) => {}, []);

  return processAction;
};

export default useConfirmationAlertActions;
