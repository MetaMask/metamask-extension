import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { getToAccount } from '../../../ducks/bridge/selectors';
import type { DestinationAccount } from '../prepare/types';

export const useDestinationAccount = () => {
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<DestinationAccount | null>(null);

  const toAccount = useSelector(getToAccount);

  useEffect(() => {
    // Use isSwap parameter to determine behavior
    // This preserves legacy behavior when unified UI is disabled
    setSelectedDestinationAccount(toAccount);
  }, [toAccount]);

  return { selectedDestinationAccount, setSelectedDestinationAccount };
};
