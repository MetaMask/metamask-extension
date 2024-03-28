import React from 'react';

import useLedgerConnection from '../../../hooks/useLedgerConnection';

const LedgerInfo: React.FC = () => {
  const { isLedgerWallet } = useLedgerConnection();

  if (isLedgerWallet) {
    // todo: ledger warning banner to come below.
    return <div>LEDGER BANNER</div>;
  }
  return null;
};

export default LedgerInfo;
