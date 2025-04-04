import React from 'react';
import { EthOverview } from '../../app/wallet-overview';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';
import { useSelector } from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { getIsDefiPositionsEnabled } from '../../../selectors';
///: END:ONLY_INCLUDE_IF


export type AccountOverviewEthProps = AccountOverviewCommonProps;

export const AccountOverviewEth = (props: AccountOverviewEthProps) => {


  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const defiPositionsEnabled = useSelector(getIsDefiPositionsEnabled);
  ///: END:ONLY_INCLUDE_IF

  console.log('defiPositionsEnabled', defiPositionsEnabled);

  return (
    <AccountOverviewLayout
      showTokens={true}
      showNfts={true}
      showActivity={true}
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      showDefi={defiPositionsEnabled}
      ///: END:ONLY_INCLUDE_IF
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
