import React from 'react';
import { useSelector } from 'react-redux';
import { getMultichainSelectedAccountCachedBalance } from '../../../selectors/multichain';
import { getSelectedMultichainNetworkConfiguration } from '../../../selectors/multichain/networks';

import { getIsSwapsChain, getIsBridgeChain } from '../../../selectors';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { CoinOverview } from './coin-overview';

type NonEvmOverviewProps = {
  className?: string;
};

const NonEvmOverview = ({ className }: NonEvmOverviewProps) => {
  const { chainId } = useSelector(getSelectedMultichainNetworkConfiguration);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const account = useSelector(getSelectedInternalAccount);

  let isSwapsChain = false;
  let isBridgeChain = false;
  isSwapsChain = useSelector((state) => getIsSwapsChain(state, chainId));
  isBridgeChain = useSelector((state) => getIsBridgeChain(state, chainId));

  return (
    <CoinOverview
      account={account}
      balance={balance}
      // We turn this off to avoid having that asterisk + the "Balance maybe be outdated" message for now
      balanceIsCached={false}
      className={className}
      chainId={chainId}
      isSigningEnabled={true}
      isSwapsChain={isSwapsChain}
      isBridgeChain={isBridgeChain}
    />
  );
};

export default NonEvmOverview;
