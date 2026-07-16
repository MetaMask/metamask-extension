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
      showDefi={true}
      showActivity={true}
      {...props}
    >
      {<EthOverview />}
    </AccountOverviewLayout>
  );
};
