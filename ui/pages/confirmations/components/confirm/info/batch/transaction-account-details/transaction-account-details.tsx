import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { useConfirmContext } from '../../../../../context/confirm';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useIsUpgradeTransaction } from '../../hooks/useIsUpgradeTransaction';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';

export function TransactionAccountDetails() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isUpgrade = useIsUpgradeTransaction();
  const { chainId, txParams } = currentConfirmation;
  const { from } = txParams;

  if (!isUpgrade) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label={t('account')}>
        <ConfirmInfoRowAddress chainId={chainId} address={from} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('confirmAccountType')}>
        <ConfirmInfoRowText text={t('confirmAccountTypeSmartContract')} />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
}
