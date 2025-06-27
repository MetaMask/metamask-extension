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
  getSwapsDefaultToken,
  getIsBridgeChain,
} from '../../../selectors';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
import { CoinOverview } from './coin-overview';

const EthOverview = ({ className }) => {
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  // FIXME: This causes re-renders, so use isEqual to avoid this
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);
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
      isBridgeChain={isBridgeChain}
      isBuyableChain={isBuyableChain}
      defaultSwapsToken={defaultSwapsToken}
    />
  );
};

EthOverview.propTypes = {
  className: PropTypes.string,
};

export default EthOverview;
