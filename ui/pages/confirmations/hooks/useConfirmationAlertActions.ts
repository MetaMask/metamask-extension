import { useCallback } from 'react';

// This hook is responsible for processing confirmation actions.
// Depending on the action type, we will call type-specific hooks.
const useConfirmationAlertActions = () => {
  const processAction = useCallback((_actionKey: string) => {
  }, []);

  return processAction;
};

export default useConfirmationAlertActions;
