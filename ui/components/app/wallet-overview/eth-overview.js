import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { EthMethod } from '@metamask/keyring-api';
import { isEqual } from 'lodash';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import {
  isBalanceCached,
  getIsSwapsChain,
  getSelectedInternalAccount,
  getSelectedAccountCachedBalance,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getSwapsDefaultToken,
  getIsBridgeChain,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF
import { CoinOverview } from './coin-overview';

const EthOverview = ({ className }) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  // FIXME: This causes re-renders, so use isEqual to avoid this
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);
  ///: END:ONLY_INCLUDE_IF
  const balanceIsCached = useSelector(isBalanceCached);
  const chainId = useSelector(getCurrentChainId);
  const balance = useSelector(getSelectedAccountCachedBalance);

  // FIXME: This causes re-renders, so use isEqual to avoid this
  const account = useSelector(getSelectedInternalAccount, isEqual);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isSigningEnabled =
    account.methods.includes(EthMethod.SignTransaction) ||
    account.methods.includes(EthMethod.SignUserOperation);

  return (
    <CoinOverview
      account={account}
      balance={balance}
      balanceIsCached={balanceIsCached}
      className={className}
      classPrefix="eth"
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
