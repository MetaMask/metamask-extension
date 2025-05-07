import React from 'react';
import { useSelector } from 'react-redux';
import { EthOverview } from '../../app/wallet-overview';
import { getIsDefiPositionsEnabled } from '../../../selectors';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewEthProps = AccountOverviewCommonProps;

export const AccountOverviewEth = (props: AccountOverviewEthProps) => {
  const defiPositionsEnabled = useSelector(getIsDefiPositionsEnabled);
  return (
    <AccountOverviewLayout
      showTokens={true}
      showNfts={true}
      showDefi={defiPositionsEnabled}
      showActivity={true}
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
