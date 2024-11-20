import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useConfirmContext } from '../../../../context/confirm';
import { SimulationDetails } from '../../../simulation-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import SendHeading from '../shared/send-heading/send-heading';
import {
  stxAlertIsOpen,
  dismissSTXMigrationAlert,
} from '../../../../../../ducks/alerts/stx-migration';
import { STXBannerAlert } from '../../../stx-banner-alert';
import { TokenDetailsSection } from './token-details-section';
import { TransactionFlowSection } from './transaction-flow-section';

const TokenTransferInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const isWalletInitiated = transactionMeta.origin === 'metamask';
  const dispatch = useDispatch();
  const shouldShowSTXAlert = useSelector(stxAlertIsOpen);

  return (
    <>
      {shouldShowSTXAlert && (
        <STXBannerAlert onClose={() => dispatch(dismissSTXMigrationAlert())} />
      )}
      <SendHeading />
      <TransactionFlowSection />
      {
        <ConfirmInfoSection noPadding>
          <SimulationDetails
            transaction={transactionMeta}
            isTransactionsRedesign
            enableMetrics
            metricsOnly={isWalletInitiated}
          />
        </ConfirmInfoSection>
      }
      <TokenDetailsSection />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default TokenTransferInfo;
