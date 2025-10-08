import React from 'react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

export const AccountDetails = ({
  accountAddress,
  chainId,
}: {
  accountAddress: string;
  chainId: string;
}) => {
  const t = useI18nContext();

  return (
    <ConfirmInfoSection data-testid="shield-subscription-approve__account_details_section">
      <ConfirmInfoRow
        label={t('account')}
        style={{ color: 'var(--color-text-alternative)' }}
      >
        <ConfirmInfoRowAddress address={accountAddress} chainId={chainId} />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};
