import React from 'react';
import { BtcOverview } from '../../app/wallet-overview';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewBtcProps = AccountOverviewCommonProps;

export const AccountOverviewBtc = (props: AccountOverviewBtcProps) => {
  return (
    <AccountOverviewLayout
      showTokens={true}
      showTokensLinks={false}
      showNfts={false}
      showActivity={true}
      {...props}
    >
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask,build-mmi)
        <BtcOverview />
        ///: END:ONLY_INCLUDE_IF
      }
    </AccountOverviewLayout>
  );
};
