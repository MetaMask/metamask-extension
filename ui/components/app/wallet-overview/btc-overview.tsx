import React from 'react';
import { useSelector } from 'react-redux';
import {
  getMultichainProviderConfig,
  getMultichainSelectedAccountCachedBalance,
} from '../../../selectors/multichain';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getIsBitcoinBuyable } from '../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF
import { CoinOverview } from './coin-overview';

type BtcOverviewProps = {
  className?: string;
};

const BtcOverview = ({ className }: BtcOverviewProps) => {
  const { chainId } = useSelector(getMultichainProviderConfig);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBtcBuyable = useSelector(getIsBitcoinBuyable);
  ///: END:ONLY_INCLUDE_IF

  return (
    <CoinOverview
      balance={balance}
      // We turn this off to avoid having that asterisk + the "Balance maybe be outdated" message for now
      balanceIsCached={false}
      className={className}
      chainId={chainId}
      isSigningEnabled={false}
      isSwapsChain={false}
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      isBridgeChain={false}
      isBuyableChain={isBtcBuyable}
      ///: END:ONLY_INCLUDE_IF
    />
  );
};

export default BtcOverview;
