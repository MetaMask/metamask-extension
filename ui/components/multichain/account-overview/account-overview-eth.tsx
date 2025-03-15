import React from 'react';
import { EthOverview } from '../../app/wallet-overview';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewEthProps = AccountOverviewCommonProps;

export const AccountOverviewEth = (props: AccountOverviewEthProps) => {
  return (
    <AccountOverviewLayout
      showTokens={true}
      showNfts={true}
      showActivity={true}
      showDefi={true}
      {...props}
    >
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        <EthOverview />
        ///: END:ONLY_INCLUDE_IF
      }
    </AccountOverviewLayout>
  );
};
