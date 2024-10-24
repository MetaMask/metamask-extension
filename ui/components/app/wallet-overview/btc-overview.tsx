import React from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import {
  getMultichainProviderConfig,
  getMultichainSelectedAccountCachedBalance,
} from '../../../selectors/multichain';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getIsBitcoinBuyable } from '../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF
import { getSelectedInternalAccount } from '../../../selectors';
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

  // FIXME: This causes re-renders, so use isEqual to avoid this
  const account = useSelector(getSelectedInternalAccount, isEqual);

  return (
    <CoinOverview
      account={account}
      balance={balance}
      // We turn this off to avoid having that asterisk + the "Balance maybe be outdated" message for now
      balanceIsCached={false}
      className={className}
      chainId={chainId}
      isSigningEnabled={true}
      isSwapsChain={false}
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      isBridgeChain={false}
      isBuyableChain={isBtcBuyable}
      ///: END:ONLY_INCLUDE_IF
    />
  );
};

export default BtcOverview;
