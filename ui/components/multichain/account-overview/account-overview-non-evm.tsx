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
      showTokens
      showTokensLinks={false}
      showNfts={false}
      showActivity
      {...props}
    >
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        <NonEvmOverview />
        ///: END:ONLY_INCLUDE_IF
      }
    </AccountOverviewLayout>
  );
};
