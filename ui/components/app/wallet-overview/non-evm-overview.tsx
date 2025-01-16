import React from 'react';
import { useSelector } from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { BtcAccountType } from '@metamask/keyring-api';
///: END:ONLY_INCLUDE_IF
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
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
///: END:ONLY_INCLUDE_IF
import {
  getIsSwapsChain,
  getIsBridgeChain,
  getSelectedInternalAccount,
  getSwapsDefaultToken,
} from '../../../selectors';
import { CoinOverview } from './coin-overview';

type NonEvmOverviewProps = {
  className?: string;
};

const NonEvmOverview = ({ className }: NonEvmOverviewProps) => {
  const { chainId } = useSelector(getMultichainProviderConfig);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const account = useSelector(getSelectedInternalAccount);
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBtcMainnetAccount = useMultichainSelector(
    getMultichainIsMainnet,
    account,
  );
  const isBtcBuyable = useSelector(getIsBitcoinBuyable);

  // TODO: Update this to add support to check if Solana is buyable when the Send flow starts
  const accountType = account.type;
  const isBtc = accountType === BtcAccountType.P2wpkh;
  const isBuyableChain = isBtc ? isBtcBuyable && isBtcMainnetAccount : false;
  ///: END:ONLY_INCLUDE_IF
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);

  const isSwapsChain = useSelector(getIsSwapsChain);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBridgeChain = useSelector(getIsBridgeChain);
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
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      isBridgeChain={isBridgeChain}
      isBuyableChain={isBuyableChain}
      ///: END:ONLY_INCLUDE_IF
    />
  );
};

export default NonEvmOverview;
