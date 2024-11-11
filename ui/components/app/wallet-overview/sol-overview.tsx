import React from 'react';
import { useSelector } from 'react-redux';
import {
  getMultichainProviderConfig,
  getMultichainSelectedAccountCachedBalance,
} from '../../../selectors/multichain';
import { CoinOverview } from './coin-overview';

type SolOverviewProps = {
  className?: string;
};

const SolOverview = ({ className }: SolOverviewProps) => {
  const { chainId } = useSelector(getMultichainProviderConfig);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);

  return (
    <CoinOverview
      balance={balance}
      balanceIsCached={false}
      className={className}
      chainId={chainId}
      isSigningEnabled={true}
      isSwapsChain={false}
      isBridgeChain={false}
      isBuyableChain={false}
    />
  );
};

export default SolOverview;
