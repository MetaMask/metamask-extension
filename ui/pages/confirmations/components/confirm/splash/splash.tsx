import React from 'react';
import { useIsUpgradeTransaction } from '../info/hooks/useIsUpgradeTransaction';
import { SmartAccountUpdate } from './smart-account-update';

export function Splash() {
  const isUpgradeTransaction = useIsUpgradeTransaction();

  if (!isUpgradeTransaction) {
    return null;
  }

  return <SmartAccountUpdate />;
}
