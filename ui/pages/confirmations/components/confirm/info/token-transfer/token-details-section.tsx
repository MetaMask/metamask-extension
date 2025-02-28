import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { ORIGIN_METAMASK } from '../../../../../../../shared/constants/app';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../selectors/preferences';
import { useBalanceChanges } from '../../../simulation-details/useBalanceChanges';
import { OriginRow } from '../shared/transaction-details/transaction-details';
import { NetworkRow } from '../shared/network-row/network-row';

export const TokenDetailsSection = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta;
  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const isSimulationError = Boolean(
    transactionMeta.simulationData?.error?.code,
  );
  const balanceChangesResult = useBalanceChanges({
    chainId,
    simulationData: transactionMeta.simulationData,
  });
  const balanceChanges = balanceChangesResult.value;
  const isSimulationEmpty = balanceChanges.length === 0;

  const shouldShowTokenRow =
    transactionMeta.type !== TransactionType.simpleSend &&
    (showAdvancedDetails || isSimulationEmpty || isSimulationError);

  const tokenRow = shouldShowTokenRow && (
    <ConfirmInfoRow
      label={t('interactingWith')}
      tooltip={t('interactingWithTransactionDescription')}
    >
      <ConfirmInfoRowAddress
        address={transactionMeta.txParams.to as string}
        chainId={chainId}
      />
    </ConfirmInfoRow>
  );

  const shouldShowOriginRow = transactionMeta?.origin !== ORIGIN_METAMASK;

  return (
    <ConfirmInfoSection data-testid="confirmation__token-details-section">
      <NetworkRow />
      {shouldShowOriginRow && <OriginRow />}
      {shouldShowTokenRow && <ConfirmInfoRowDivider />}
      {tokenRow}
    </ConfirmInfoSection>
  );
};
