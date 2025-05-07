import React from 'react';
import { useIsUpgradeTransaction } from '../info/hooks/useIsUpgradeTransaction';
import { SmartAccountUpdate } from './smart-account-update';

export function Splash() {
  const { isUpgrade } = useIsUpgradeTransaction();

  if (!isUpgrade) {
    return null;
  }

  return <SmartAccountUpdate />;
}
