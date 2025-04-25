import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';

import { isBatchTransaction } from '../../../../../../../../shared/lib/transactions.utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import {
  useIsDowngradeTransaction,
  useIsUpgradeTransaction,
} from '../../hooks/useIsUpgradeTransaction';
import { RecipientRow } from '../../shared/transaction-details/transaction-details';

export function TransactionAccountDetails() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { isUpgrade, isUpgradeOnly } = useIsUpgradeTransaction();
  const isDowngrade = useIsDowngradeTransaction();
  const { chainId, nestedTransactions, txParams, id } = currentConfirmation;
  const { from } = txParams;
  const isBatch = isBatchTransaction(nestedTransactions);

  if (!isUpgrade && !isDowngrade) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      {(isUpgradeOnly || isDowngrade) && (
        <ConfirmInfoRow label={t('account')}>
          <ConfirmInfoRowAddress chainId={chainId} address={from} />
        </ConfirmInfoRow>
      )}
      {isUpgrade && (
        <>
          <ConfirmInfoAlertRow
            alertKey={RowAlertKey.AccountTypeUpgrade}
            label={
              isBatch
                ? t('confirmInfoAccountType')
                : t('confirmInfoAccountCurrentType')
            }
            ownerId={id}
          >
            <ConfirmInfoRowText
              text={t('confirmAccountTypeStandard')}
              data-testid="tx-type"
            />
          </ConfirmInfoAlertRow>
          <ConfirmInfoRow label={t('confirmInfoAccountNewType')}>
            <ConfirmInfoRowText text={t('confirmAccountTypeSmartContract')} />
          </ConfirmInfoRow>
        </>
      )}
      {isDowngrade && (
        <>
          <ConfirmInfoRow label={t('confirmInfoAccountCurrentType')}>
            <ConfirmInfoRowText text={t('confirmAccountTypeSmartContract')} />
          </ConfirmInfoRow>
          <ConfirmInfoRow label={t('confirmInfoAccountNewType')}>
            <ConfirmInfoRowText text={t('confirmAccountTypeStandard')} />
          </ConfirmInfoRow>
        </>
      )}
      {(isBatch || isUpgrade) && <RecipientRow />}
    </ConfirmInfoSection>
  );
}
