import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useMemo } from 'react';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { Box, Text } from '../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  Severity,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { useEnableShieldCoverageChecks } from '../../../../hooks/transactions/useEnableShieldCoverageChecks';
import useAlerts from '../../../../../../hooks/useAlerts';
import ShieldIconAnimation from './shield-icon-animation';

const ShieldFooterCoverageIndicator = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { getFieldAlerts } = useAlerts(currentConfirmation?.id ?? '');
  const fieldAlerts = getFieldAlerts(RowAlertKey.ShieldFooterCoverageIndicator);
  const selectedAlert = fieldAlerts[0];
  const selectedAlertSeverity = selectedAlert?.severity;

  const { isPaused, isShowCoverageIndicator } = useEnableShieldCoverageChecks();

  const animationSeverity = useMemo(() => {
    if (isPaused) {
      return Severity.Warning;
    }
    return selectedAlertSeverity;
  }, [isPaused, selectedAlertSeverity]);

  if (!currentConfirmation || !isShowCoverageIndicator) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      paddingLeft={4}
      paddingRight={4}
      // box shadow to match the original var(--shadow-size-md) on the footer,
      // but only applied to the top of the box, so it doesn't overlap with
      // the existing
      style={{ boxShadow: '0 -4px 16px -8px var(--color-shadow-default)' }}
    >
      <Box marginTop={2}>
        <ShieldIconAnimation
          severity={animationSeverity}
          playAnimation={!isPaused}
        />
      </Box>
      <ConfirmInfoAlertRow
        alertKey={RowAlertKey.ShieldFooterCoverageIndicator}
        ownerId={currentConfirmation.id}
        label=""
        labelChildren={
          <Text variant={TextVariant.bodyMdMedium} color={TextColor.inherit}>
            {t('transactionShield')}
          </Text>
        }
        style={{
          marginBottom: 0,
          alignItems: AlignItems.center,
          width: '100%',
        }}
        showAlertLoader
      />
    </Box>
  );
};

export default ShieldFooterCoverageIndicator;
