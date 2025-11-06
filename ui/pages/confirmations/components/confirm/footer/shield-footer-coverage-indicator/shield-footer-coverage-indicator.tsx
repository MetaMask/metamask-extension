import { SignatureRequest } from '@metamask/signature-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useMemo } from 'react';
import {
  PRODUCT_TYPES,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
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
import {
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../../../../hooks/subscription/useSubscription';
import { getIsShieldSubscriptionPaused } from '../../../../../../../shared/lib/shield';
import ShieldIconAnimation from './shield-icon-animation';

const ShieldFooterCoverageIndicator = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | SignatureRequest
  >();
  const isShowShieldFooterCoverageIndicator = useEnableShieldCoverageChecks();
  const { getFieldAlerts } = useAlerts(currentConfirmation?.id ?? '');
  const { subscriptions } = useUserSubscriptions();

  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  const isPaused = getIsShieldSubscriptionPaused(subscriptions);

  const fieldAlerts = getFieldAlerts(RowAlertKey.ShieldFooterCoverageIndicator);
  const selectedAlert = fieldAlerts[0];
  const selectedAlertSeverity = selectedAlert?.severity;

  const animationSeverity = useMemo(() => {
    if (isPaused) {
      return Severity.Warning;
    }
    return selectedAlertSeverity;
  }, [isPaused, selectedAlertSeverity]);

  if (!currentConfirmation || !isShowShieldFooterCoverageIndicator) {
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
          playAnimation={
            shieldSubscription?.status === SUBSCRIPTION_STATUSES.trialing
          }
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
