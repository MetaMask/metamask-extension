import React from 'react';
import { EthOverview } from '../../app/wallet-overview';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonOptions } from './common';

export type AccountOverviewEthOptions = AccountOverviewCommonOptions;

export const AccountOverviewEth = (options: AccountOverviewEthOptions) => {
  return (
    <AccountOverviewLayout
      showTokens={true}
      showNfts={true}
      showActivity={true}
      {...options}
    >
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask,build-mmi)
        <EthOverview showAddress />
        ///: END:ONLY_INCLUDE_IF
      }
    </AccountOverviewLayout>
  );
};
