import React from 'react';
import { useSelector } from 'react-redux';
import { NonEvmOverview } from '../../app/wallet-overview';
import { getHasAnyEvmNetworkEnabled } from '../../../selectors';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewNonEvmProps = AccountOverviewCommonProps;

export const AccountOverviewNonEvm = ({
  ...props
}: AccountOverviewNonEvmProps) => {
  const hasAnyEvmNetworkEnabled = useSelector(getHasAnyEvmNetworkEnabled);

  return (
    <AccountOverviewLayout
      showTokens={true}
      showTokensLinks={true}
      showNfts={hasAnyEvmNetworkEnabled}
      showDefi={hasAnyEvmNetworkEnabled}
      showActivity={true}
      {...props}
    >
      <NonEvmOverview />
    </AccountOverviewLayout>
  );
};
