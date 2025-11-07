import { SignatureRequest } from '@metamask/signature-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { Box, Text } from '../../../../../../components/component-library';
import {
  AlignItems,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { useEnableShieldCoverageChecks } from '../../../../hooks/transactions/useEnableShieldCoverageChecks';

const ShieldFooterCoverageIndicator = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | SignatureRequest
  >();
  const isShowShieldFooterCoverageIndicator = useEnableShieldCoverageChecks();

  if (!isShowShieldFooterCoverageIndicator) {
    return null;
  }

  return (
    <Box
      paddingLeft={4}
      paddingRight={4}
      // box shadow to match the original var(--shadow-size-md) on the footer,
      // but only applied to the top of the box, so it doesn't overlap with
      // the existing
      style={{ boxShadow: '0 -4px 16px -8px var(--color-shadow-default)' }}
    >
      <ConfirmInfoAlertRow
        alertKey={RowAlertKey.ShieldFooterCoverageIndicator}
        ownerId={currentConfirmation.id}
        label=""
        labelChildren={
          <Text variant={TextVariant.bodyMdMedium} color={TextColor.inherit}>
            {t('transactionShield')}
          </Text>
        }
        style={{ marginBottom: 0, alignItems: AlignItems.center }}
        showAlertLoader
      />
    </Box>
  );
};

export default ShieldFooterCoverageIndicator;
