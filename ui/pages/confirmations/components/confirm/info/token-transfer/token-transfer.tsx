import React from 'react';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import SendHeading from '../shared/send-heading/send-heading';
import { TokenDetailsSection } from './token-details-section';
import { TransactionFlowSection } from './transaction-flow-section';

const TokenTransferInfo = () => {
  return (
    <>
      <SendHeading />
      <TransactionFlowSection />
      <TokenDetailsSection />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default TokenTransferInfo;
