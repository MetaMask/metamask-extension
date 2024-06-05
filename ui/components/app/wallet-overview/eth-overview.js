import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { EthMethod } from '@metamask/keyring-api';
import {
  isBalanceCached,
  getIsSwapsChain,
  getCurrentChainId,
  getSelectedInternalAccount,
  getSelectedAccountCachedBalance,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  getIsBridgeChain,
  getIsBuyableChain,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import { CoinOverview } from './coin-overview';

const EthOverview = ({ className }) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  ///: END:ONLY_INCLUDE_IF
  const balanceIsCached = useSelector(isBalanceCached);
  const chainId = useSelector(getCurrentChainId);
  const balance = useSelector(getSelectedAccountCachedBalance);

  const account = useSelector(getSelectedInternalAccount);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isSigningEnabled =
    account.methods.includes(EthMethod.SignTransaction) ||
    account.methods.includes(EthMethod.SignUserOperation);

  return (
    <CoinOverview
      balance={balance}
      balanceIsCached={balanceIsCached}
      className={className}
      chainId={chainId}
      isSigningEnabled={isSigningEnabled}
      isSwapsChain={isSwapsChain}
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      isBridgeChain={isBridgeChain}
      isBuyableChain={isBuyableChain}
      defaultSwapsToken={defaultSwapsToken}
      ///: END:ONLY_INCLUDE_IF
    />
  );
};

EthOverview.propTypes = {
  className: PropTypes.string,
};

export default EthOverview;
