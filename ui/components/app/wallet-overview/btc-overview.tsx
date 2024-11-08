import React from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getMultichainIsMainnet,
  ///: END:ONLY_INCLUDE_IF
  getMultichainProviderConfig,
  getMultichainSelectedAccountCachedBalance,
} from '../../../selectors/multichain';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getIsBitcoinBuyable } from '../../../ducks/ramps';
import { getSelectedInternalAccount } from '../../../selectors';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
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
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const isBtcMainnetAccount = useMultichainSelector(
    getMultichainIsMainnet,
    selectedAccount,
  );
  const isBtcBuyable = useSelector(getIsBitcoinBuyable);
  ///: END:ONLY_INCLUDE_IF

  // FIXME: Use `isEqual` to avoid potential re-renders
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
      isBuyableChain={isBtcBuyable && isBtcMainnetAccount}
      ///: END:ONLY_INCLUDE_IF
    />
  );
};

export default BtcOverview;
