import React from 'react';
import { NonEvmOverview } from '../../app/wallet-overview';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewNonEvmProps = AccountOverviewCommonProps;

export const AccountOverviewNonEvm = ({
  ...props
}: AccountOverviewNonEvmProps) => {
  return (
    <AccountOverviewLayout
      showTokens={true}
      showTokensLinks={false}
      showNfts={false}
      showActivity={true}
      {...props}
    >
      <NonEvmOverview />
    </AccountOverviewLayout>
  );
};
