import React from 'react';
import { useIsUpgradeTransaction } from '../info/hooks/useIsUpgradeTransaction';
import { SmartAccountUpdate } from './smart-account-update';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function Splash() {
  const { isUpgrade } = useIsUpgradeTransaction();

  if (!isUpgrade) {
    return null;
  }

  return <SmartAccountUpdate />;
}
