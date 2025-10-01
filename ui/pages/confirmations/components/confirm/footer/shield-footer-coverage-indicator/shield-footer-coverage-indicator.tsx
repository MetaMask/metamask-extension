import { SignatureRequest } from '@metamask/signature-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useAlertMetrics } from '../../../../../../components/app/alert-system/contexts/alertMetricsContext';
import InlineAlert from '../../../../../../components/app/alert-system/inline-alert/inline-alert';
import { MultipleAlertModal } from '../../../../../../components/app/alert-system/multiple-alert-modal';
import { ConfirmInfoRow } from '../../../../../../components/app/confirm/info/row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { Box, Text } from '../../../../../../components/component-library';
import {
  AlignItems,
  Severity,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  getCoverageStatus,
  ShieldState,
} from '../../../../../../selectors/shield/coverage';
import { useConfirmContext } from '../../../../context/confirm';

const ShieldFooterCoverageIndicator = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | SignatureRequest
  >();
  const { trackInlineAlertClicked } = useAlertMetrics();

  const coverageStatus = useSelector((state) =>
    getCoverageStatus(state as ShieldState, currentConfirmation.id),
  );

  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);

  const handleModalClose = () => {
    setAlertModalVisible(false);
  };

  const handleInlineAlertClick = () => {
    setAlertModalVisible(true);
    trackInlineAlertClicked(RowAlertKey.ShieldFooterCoverageIndicator);
  };

  return (
    <Box
      paddingLeft={4}
      paddingRight={4}
      // box shadow to match the original var(--shadow-size-md) on the footer,
      // but only applied to the top of the box, so it doesn't overlap with
      // the existing
      style={{ boxShadow: '0 -4px 16px -8px var(--color-shadow-default)' }}
    >
      {alertModalVisible && (
        <MultipleAlertModal
          alertKey={RowAlertKey.ShieldFooterCoverageIndicator}
          ownerId={currentConfirmation.id}
          onFinalAcknowledgeClick={handleModalClose}
          onClose={handleModalClose}
          showCloseIcon={false}
          skipAlertNavigation={true}
        />
      )}
      <ConfirmInfoRow
        label=""
        labelChildren={
          <Text variant={TextVariant.bodyMdMedium} color={TextColor.inherit}>
            {t('transactionShield')}
          </Text>
        }
        style={{ marginBottom: 0, alignItems: AlignItems.center }}
      >
        <InlineAlert
          showArrow={false}
          severity={
            coverageStatus === 'covered' ? Severity.Success : Severity.Info
          }
          textOverride={t(
            coverageStatus === 'covered' ? 'shieldCovered' : 'shieldNotCovered',
          )}
          onClick={
            coverageStatus === 'covered' ? undefined : handleInlineAlertClick
          }
          style={
            coverageStatus === 'covered' ? { cursor: 'default' } : undefined
          }
        />
      </ConfirmInfoRow>
    </Box>
  );
};

export default ShieldFooterCoverageIndicator;
