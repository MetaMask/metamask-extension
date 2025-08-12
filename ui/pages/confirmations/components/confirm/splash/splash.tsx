import React from 'react';
import { useIsUpgradeTransaction } from '../info/hooks/useIsUpgradeTransaction';
import { SmartAccountUpdateSplash } from './smart-account-update-splash';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function Splash() {
  const { isUpgrade } = useIsUpgradeTransaction();

  if (!isUpgrade) {
    return null;
  }

  return <SmartAccountUpdateSplash />;
}
