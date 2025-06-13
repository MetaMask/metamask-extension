import React from 'react';
import { useSelector } from 'react-redux';
import { getMultichainSelectedAccountCachedBalance } from '../../../selectors/multichain';
import { getSelectedMultichainNetworkConfiguration } from '../../../selectors/multichain/networks';

import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  getIsSwapsChain,
  getIsBridgeChain,
  ///: END:ONLY_INCLUDE_IF
  getSelectedInternalAccount,
  getSwapsDefaultToken,
} from '../../../selectors';
import { CoinOverview } from './coin-overview';

type NonEvmOverviewProps = {
  className?: string;
};

const NonEvmOverview = ({ className }: NonEvmOverviewProps) => {
  const { chainId } = useSelector(getSelectedMultichainNetworkConfiguration);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const account = useSelector(getSelectedInternalAccount);
  const isNativeTokenBuyable = useSelector(getIsNativeTokenBuyable);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);

  let isSwapsChain = false;
  let isBridgeChain = false;
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  isSwapsChain = useSelector((state) => getIsSwapsChain(state, chainId));
  isBridgeChain = useSelector((state) => getIsBridgeChain(state, chainId));
  ///: END:ONLY_INCLUDE_IF

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
      defaultSwapsToken={defaultSwapsToken}
      isBridgeChain={isBridgeChain}
      isBuyableChain={isNativeTokenBuyable}
    />
  );
};

export default NonEvmOverview;
