import React, { useCallback, useState } from 'react';
import { DeveloperButton } from '../developer-button';
import { usePerpsDepositTrigger } from '../../../hooks/perps/usePerpsDepositTrigger';

export const PerpsDepositButton = () => {
  const [hasTriggered, setHasTriggered] = useState(false);
  const { trigger, isLoading } = usePerpsDepositTrigger();

  const handleTrigger = useCallback(async () => {
    const triggerResult = await trigger();
    if (triggerResult) {
      setHasTriggered(true);
    }
  }, [trigger]);

  return (
    <DeveloperButton
      title="Perps Deposit"
      description="Triggers a Perps deposit confirmation."
      buttonLabel={isLoading ? 'Loading...' : 'Trigger'}
      onPress={handleTrigger}
      hasTriggered={hasTriggered}
      disabled={isLoading}
    />
  );
};
