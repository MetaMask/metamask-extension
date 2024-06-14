import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { CoinOverview } from './coin-overview';

const BtcOverview = ({ className }) => {
  // TODO: Use new BalancesController to read those from the
  // global state.
  const [balance] = useState('0.00000001');

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
