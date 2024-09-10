import React from 'react';
import { CaipChainId } from '@metamask/utils';
import { MultichainNetworks } from '../../../../../../../shared/constants/multichain/networks';
import { BitcoinTransactionNotice } from './bitcoin-transaction-notice';

export type MultichainNoticesProps = {
  network: CaipChainId;
};

export const MultichainNotices: React.FC<MultichainNoticesProps> = ({
  network,
}) => {
  switch (network) {
    case MultichainNetworks.BITCOIN:
    case MultichainNetworks.BITCOIN_TESTNET: {
      return <BitcoinTransactionNotice />;
    }
    default: {
      return <></>;
    }
  }
};
