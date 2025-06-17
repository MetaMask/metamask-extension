import React from 'react';
import { useIsUpgradeTransaction } from '../info/hooks/useIsUpgradeTransaction';
import { SmartAccountUpdateSplash } from './smart-account-update-splash';

export function Splash() {
  const { isUpgrade } = useIsUpgradeTransaction();

  if (!isUpgrade) {
    return null;
  }

  return <SmartAccountUpdateSplash />;
}
