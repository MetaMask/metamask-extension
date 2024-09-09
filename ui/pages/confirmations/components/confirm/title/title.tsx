import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { memo, useMemo } from 'react';

import { Box, Text } from '../../../../../components/component-library';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getHighestSeverity } from '../../../../../components/app/alert-system/utils';
import GeneralAlert from '../../../../../components/app/alert-system/general-alert/general-alert';
import { Confirmation, SignatureRequestType } from '../../../types/confirm';
import {
  isPermitSignatureRequest,
  isSIWESignatureRequest,
} from '../../../utils';
import { useConfirmContext } from '../../../context/confirm';
import { useIsNFT } from '../info/approve/hooks/use-is-nft';

function ConfirmBannerAlert({ ownerId }: { ownerId: string }) {
  const t = useI18nContext();
  const { generalAlerts } = useAlerts(ownerId);

  if (generalAlerts.length === 0) {
    return null;
  }

  const hasMultipleAlerts = generalAlerts.length > 1;
  const singleAlert = generalAlerts[0];
  const highestSeverity = hasMultipleAlerts
    ? getHighestSeverity(generalAlerts)
    : singleAlert.severity;
  return (
    <Box marginTop={4}>
      <GeneralAlert
        data-testid="confirm-banner-alert"
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
        severity={highestSeverity}
        provider={hasMultipleAlerts ? undefined : singleAlert.provider}
        details={hasMultipleAlerts ? undefined : singleAlert.alertDetails}
        reportUrl={singleAlert.reportUrl}
      />
    </Box>
  );
}

type IntlFunction = (str: string) => string;

const getTitle = (
  t: IntlFunction,
  confirmation?: Confirmation,
  isNFT?: boolean,
) => {
  switch (confirmation?.type) {
    case TransactionType.contractInteraction:
      return t('confirmTitleTransaction');
    case TransactionType.tokenMethodApprove:
      if (isNFT) {
        return t('confirmTitleApproveTransaction');
      }
      return t('confirmTitlePermitSignature');
    case TransactionType.deployContract:
      return t('confirmTitleDeployContract');
    case TransactionType.personalSign:
      if (isSIWESignatureRequest(confirmation as SignatureRequestType)) {
        return t('confirmTitleSIWESignature');
      }
      return t('confirmTitleSignature');
    case TransactionType.signTypedData:
      return isPermitSignatureRequest(confirmation as SignatureRequestType)
        ? t('confirmTitlePermitSignature')
        : t('confirmTitleSignature');
    default:
      return '';
  }
};

const getDescription = (
  t: IntlFunction,
  confirmation?: Confirmation,
  isNFT?: boolean,
) => {
  switch (confirmation?.type) {
    case TransactionType.contractInteraction:
      return '';
    case TransactionType.tokenMethodApprove:
      if (isNFT) {
        return t('confirmTitleDescApproveTransaction');
      }
      return t('confirmTitleDescERC20ApproveTransaction');
    case TransactionType.deployContract:
      return t('confirmTitleDescDeployContract');
    case TransactionType.personalSign:
      if (isSIWESignatureRequest(confirmation as SignatureRequestType)) {
        return t('confirmTitleDescSIWESignature');
      }
      return t('confirmTitleDescSignature');
    case TransactionType.signTypedData:
      return isPermitSignatureRequest(confirmation as SignatureRequestType)
        ? t('confirmTitleDescPermitSignature')
        : t('confirmTitleDescSignature');
    default:
      return '';
  }
};

const ConfirmTitle: React.FC = memo(() => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const { isNFT } = useIsNFT(currentConfirmation as TransactionMeta);

  const title = useMemo(
    () => getTitle(t as IntlFunction, currentConfirmation, isNFT),
    [currentConfirmation, isNFT],
  );

  const description = useMemo(
    () => getDescription(t as IntlFunction, currentConfirmation, isNFT),
    [currentConfirmation, isNFT],
  );

  if (!currentConfirmation) {
    return null;
  }

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
