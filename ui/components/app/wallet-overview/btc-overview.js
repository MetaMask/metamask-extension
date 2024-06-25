import React from 'react';
import PropTypes from 'prop-types';

import { useSelector } from 'react-redux';
import {
  getMultichainProviderConfig,
  getMultichainSelectedAccountCachedBalance,
} from '../../../selectors/multichain';
import { CoinOverview } from './coin-overview';

const BtcOverview = ({ className }) => {
  const { chainId } = useSelector(getMultichainProviderConfig);
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);

  return (
    <CoinOverview
      balance={balance}
      balanceIsCached
      className={className}
      chainId={chainId}
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
