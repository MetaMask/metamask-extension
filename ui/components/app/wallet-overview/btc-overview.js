import React from 'react';
import PropTypes from 'prop-types';

import { useSelector } from 'react-redux';
import {
  MultichainNetworks,
  MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19,
} from '../../../../shared/constants/multichain/networks';
import { getSelectedInternalAccount } from '../../../selectors';
import { getMultichainBalances } from '../../../selectors/multichain';
import { CoinOverview } from './coin-overview';

const BtcOverview = ({ className }) => {
  const account = useSelector(getSelectedInternalAccount);
  const balances = useSelector(getMultichainBalances);
  const asset = MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19.BTC;
  // If `undefined`, a spinner will be shown
  const balance = balances[account.id]?.[asset];
  // TODO: find dynamic way to ensure balance is the highest denomination.

  return (
    <CoinOverview
      balance={balance?.amount}
      balanceIsCached={false}
      balanceRaw
      className={className}
      chainId={MultichainNetworks.BITCOIN}
      isSigningEnabled={false}
      isSwapsChain={false}
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      isBridgeChain={false}
      isBuyableChain
      isBuyableChainWithoutSigning
      ///: END:ONLY_INCLUDE_IF
    />
  );
};

BtcOverview.propTypes = {
  className: PropTypes.string,
};

export default BtcOverview;
