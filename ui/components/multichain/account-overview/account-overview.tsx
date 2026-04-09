import React from 'react';
import { AccountOverviewEth } from './account-overview-eth';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewProps = AccountOverviewCommonProps & {
  useExternalServices: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function AccountOverview(props: AccountOverviewProps) {
  const renderAccountOverviewOption = () => (
    <AccountOverviewEth {...props}></AccountOverviewEth>
  );

  return <>{renderAccountOverviewOption()}</>;
}
