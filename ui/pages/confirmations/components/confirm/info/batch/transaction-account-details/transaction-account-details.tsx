import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import {
  useIsDowngradeTransaction,
  useIsUpgradeTransaction,
} from '../../hooks/useIsUpgradeTransaction';
import { SmartContractWithLogo } from '../../shared/smart-contract-with-logo';

export function TransactionAccountDetails() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { isUpgrade } = useIsUpgradeTransaction();
  const isDowngrade = useIsDowngradeTransaction();
  const { chainId, txParams } = currentConfirmation;
  const { from } = txParams;

  if (!isUpgrade && !isDowngrade) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label={t('account')}>
        <ConfirmInfoRowAddress chainId={chainId} address={from} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('confirmAccountCurrentType')}>
        <ConfirmInfoRowText
          text={
            isUpgrade
              ? t('confirmAccountTypeStandard')
              : t('confirmAccountTypeSmartContract')
          }
        />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('confirmAccountNewType')}>
        <ConfirmInfoRowText
          text={
            isUpgrade
              ? t('confirmAccountTypeSmartContract')
              : t('confirmAccountTypeStandard')
          }
        />
      </ConfirmInfoRow>
      {isUpgrade && (
        <ConfirmInfoRow
          label={t('interactingWith')}
          tooltip={t('interactingWithTransactionDescription')}
        >
          <SmartContractWithLogo />
        </ConfirmInfoRow>
      )}
    </ConfirmInfoSection>
  );
}
