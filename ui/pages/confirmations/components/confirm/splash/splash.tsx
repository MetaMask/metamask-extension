// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { useIsUpgradeTransaction } from '../info/hooks/useIsUpgradeTransaction';
import { SmartAccountUpdate } from './smart-account-update';

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function Splash() {
  const isUpgradeTransaction = useIsUpgradeTransaction();

  if (!isUpgradeTransaction) {
    return null;
  }

  return <SmartAccountUpdate />;
}
