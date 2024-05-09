import { TransactionType } from '@metamask/transaction-controller';
import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Text,
} from '../../../../../components/component-library';
import {
  Severity,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../selectors';
import { Confirmation } from '../../../types/confirm';
import useAlerts from '../../../../../hooks/useAlerts';
import { getHighestSeverity } from '../../../../../components/app/confirmations/alerts/utils';

function getBannerAlertSeverity(severity: Severity): BannerAlertSeverity {
  switch (severity) {
    case Severity.Danger:
      return BannerAlertSeverity.Danger;
    case Severity.Warning:
      return BannerAlertSeverity.Warning;
    default:
      return BannerAlertSeverity.Info;
  }
}

function ConfirmBannerAlert({ ownerId }: { ownerId: string }) {
  const t = useI18nContext();
  const { generalAlerts } = useAlerts(ownerId);
  const hasMultipleAlerts = generalAlerts.length > 1;

  if (generalAlerts.length === 0) {
    return null;
  }

  const singleAlert = generalAlerts[0];
  const highestSeverity = hasMultipleAlerts
    ? getHighestSeverity(generalAlerts)
    : singleAlert.severity;
  return (
    <BannerAlert
      data-testid={'confirm-banner-alert'}
      title={
        hasMultipleAlerts
          ? t('alertBannerMultipleAlertsTitle')
          : singleAlert.reason
      }
      description={
        hasMultipleAlerts
          ? t('alertBannerMultipleAlertsDescription')
          : singleAlert.message
      }
      severity={getBannerAlertSeverity(highestSeverity)}
      marginTop={4}
    />
  );
}

const ConfirmTitle: React.FC = memo(() => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as Confirmation;

  const typeToTitleTKey: Partial<Record<TransactionType, string>> = useMemo(
    () => ({
      [TransactionType.personalSign]: t('confirmTitleSignature'),
      [TransactionType.signTypedData]: t('confirmTitleSignature'),
      [TransactionType.contractInteraction]: t('confirmTitleTransaction'),
    }),
    [],
  );

  const typeToDescTKey: Partial<Record<TransactionType, string>> = useMemo(
    () => ({
      [TransactionType.personalSign]: t('confirmTitleDescSignature'),
      [TransactionType.signTypedData]: t('confirmTitleDescSignature'),
      [TransactionType.contractInteraction]: t(
        'confirmTitleDescContractInteractionTransaction',
      ),
    }),
    [],
  );

  if (!currentConfirmation) {
    return null;
  }

  const title =
    typeToTitleTKey[
      currentConfirmation.type || TransactionType.contractInteraction
    ];
  const description =
    typeToDescTKey[
      currentConfirmation.type || TransactionType.contractInteraction
    ];

  return (
    <>
      <ConfirmBannerAlert ownerId={currentConfirmation.id} />
      <Text
        variant={TextVariant.headingLg}
        paddingTop={4}
        paddingBottom={2}
        textAlign={TextAlign.Center}
      >
        {title}
      </Text>
      <Text
        paddingBottom={4}
        color={TextColor.textAlternative}
        textAlign={TextAlign.Center}
      >
        {description}
      </Text>
    </>
  );
});

export default ConfirmTitle;
