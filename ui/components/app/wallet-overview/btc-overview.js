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
  // TODO: find dynamic way to ensure balance is the highest denomination.
  const { amount: balance } =
    balances[account.id][MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19.BTC];

  return (
    <CoinOverview
      balance={balance}
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
