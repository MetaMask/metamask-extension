import React from 'react';
import { useSelector } from 'react-redux';
import { NonEvmOverview } from '../../app/wallet-overview';
import {
  getIsDefiPositionsEnabled,
  getHasAnyEvmNetworkEnabled,
} from '../../../selectors';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewNonEvmProps = AccountOverviewCommonProps;

export const AccountOverviewNonEvm = ({
  ...props
}: AccountOverviewNonEvmProps) => {
  const defiPositionsEnabled = useSelector(getIsDefiPositionsEnabled);
  const hasAnyEvmNetworkEnabled = useSelector(getHasAnyEvmNetworkEnabled);

  return (
    <AccountOverviewLayout
      showTokens={true}
      showTokensLinks={true}
      showNfts={hasAnyEvmNetworkEnabled}
      showDefi={hasAnyEvmNetworkEnabled && defiPositionsEnabled}
      showActivity={true}
      {...props}
    >
      <NonEvmOverview />
    </AccountOverviewLayout>
  );
};
