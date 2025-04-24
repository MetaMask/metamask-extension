import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { useConfirmContext } from '../../../../../context/confirm';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  useIsDowngradeTransaction,
  useIsUpgradeTransaction,
} from '../../hooks/useIsUpgradeTransaction';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { RecipientRow } from '../../shared/transaction-details/transaction-details';
import { isBatchTransaction } from '../../../../../../../../shared/lib/transactions.utils';

export function TransactionAccountDetails() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isUpgrade = useIsUpgradeTransaction();
  const isDowngrade = useIsDowngradeTransaction();
  const { chainId, nestedTransactions, txParams, id } = currentConfirmation;
  const { from } = txParams;
  const isBatch = isBatchTransaction(nestedTransactions);

  if (!isUpgrade && !isDowngrade) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      {!isBatch && (
        <ConfirmInfoRow label={t('account')}>
          <ConfirmInfoRowAddress chainId={chainId} address={from} />
        </ConfirmInfoRow>
      )}
      {isUpgrade && (
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.AccountTypeUpgrade}
          label={
            isBatch ? t('confirmInfoAccountType') : t('confirmAccountType')
          }
          ownerId={id}
        >
          <ConfirmInfoRowText
            text={t('confirmAccountTypeSmartContract')}
            data-testid="tx-type"
          />
        </ConfirmInfoAlertRow>
      )}
      {isDowngrade && (
        <>
          <ConfirmInfoRow label="Current Type">
            <ConfirmInfoRowText text={t('confirmAccountTypeSmartContract')} />
          </ConfirmInfoRow>
          <ConfirmInfoRow label="New Type">
            <ConfirmInfoRowText text={t('confirmAccountTypeStandard')} />
          </ConfirmInfoRow>
        </>
      )}
      {isBatch && <RecipientRow />}
    </ConfirmInfoSection>
  );
}
