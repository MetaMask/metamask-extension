import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { memo, useMemo } from 'react';

import GeneralAlert from '../../../../../components/app/alert-system/general-alert/general-alert';
import { getHighestSeverity } from '../../../../../components/app/alert-system/utils';
import { Box, Text } from '../../../../../components/component-library';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useAssetDetails } from '../../../hooks/useAssetDetails';
import { Confirmation, SignatureRequestType } from '../../../types/confirm';
import {
  isPermitSignatureRequest,
  isSIWESignatureRequest,
} from '../../../utils';
import { useApproveTokenSimulation } from '../info/approve/hooks/use-approve-token-simulation';
import { useIsNFT } from '../info/approve/hooks/use-is-nft';
import { useDecodedTransactionData } from '../info/hooks/useDecodedTransactionData';
import { getIsRevokeSetApprovalForAll } from '../info/utils';

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
  customSpendingCap?: string,
  isRevokeSetApprovalForAll?: boolean,
) => {
  switch (confirmation?.type) {
    case TransactionType.contractInteraction:
      return t('confirmTitleTransaction');
    case TransactionType.deployContract:
      return t('confirmTitleDeployContract');
    case TransactionType.personalSign:
      if (isSIWESignatureRequest(confirmation as SignatureRequestType)) {
        return t('confirmTitleSIWESignature');
      }
      return t('confirmTitleSignature');
    case TransactionType.signTypedData:
      return isPermitSignatureRequest(confirmation as SignatureRequestType)
        ? t('confirmTitlePermitTokens')
        : t('confirmTitleSignature');
    case TransactionType.tokenMethodApprove:
      if (isNFT) {
        return t('confirmTitleApproveTransaction');
      }
      return t('confirmTitlePermitTokens');
    case TransactionType.tokenMethodIncreaseAllowance:
      return t('confirmTitlePermitTokens');
    case TransactionType.tokenMethodSetApprovalForAll:
      if (isRevokeSetApprovalForAll) {
        return t('confirmTitleSetApprovalForAllRevokeTransaction');
      }
      return t('setApprovalForAllRedesignedTitle');
    default:
      return '';
  }
};

const getDescription = (
  t: IntlFunction,
  confirmation?: Confirmation,
  isNFT?: boolean,
  customSpendingCap?: string,
  isRevokeSetApprovalForAll?: boolean,
) => {
  switch (confirmation?.type) {
    case TransactionType.contractInteraction:
      return '';
    case TransactionType.deployContract:
      return t('confirmTitleDescDeployContract');
    case TransactionType.personalSign:
      if (isSIWESignatureRequest(confirmation as SignatureRequestType)) {
        return t('confirmTitleDescSIWESignature');
      }
      return t('confirmTitleDescSign');
    case TransactionType.signTypedData:
      return isPermitSignatureRequest(confirmation as SignatureRequestType)
        ? t('confirmTitleDescPermitSignature')
        : t('confirmTitleDescSign');
    case TransactionType.tokenMethodApprove:
      if (isNFT) {
        return t('confirmTitleDescApproveTransaction');
      }
      return t('confirmTitleDescERC20ApproveTransaction');
    case TransactionType.tokenMethodIncreaseAllowance:
      return t('confirmTitleDescPermitSignature');
    case TransactionType.tokenMethodSetApprovalForAll:
      if (isRevokeSetApprovalForAll) {
        return '';
      }
      return t('confirmTitleDescApproveTransaction');

    default:
      return '';
  }
};

const isTransactionMeta = (
  confirmation: Confirmation,
): confirmation is TransactionMeta => {
  return (confirmation as TransactionMeta).txParams !== undefined;
};

const ConfirmTitle: React.FC = memo(() => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const { isNFT } = useIsNFT(currentConfirmation as TransactionMeta);

  let customSpendingCap = '';
  if (isTransactionMeta(currentConfirmation)) {
    const { decimals } = useAssetDetails(
      currentConfirmation.txParams.to,
      currentConfirmation.txParams.from,
      currentConfirmation.txParams.data,
    );

    const { spendingCap } = useApproveTokenSimulation(
      currentConfirmation,
      decimals || '0',
    );

    customSpendingCap = spendingCap;
  }

  let isRevokeSetApprovalForAll = false;
  if (
    currentConfirmation?.type === TransactionType.tokenMethodSetApprovalForAll
  ) {
    const decodedResponse = useDecodedTransactionData();

    isRevokeSetApprovalForAll = getIsRevokeSetApprovalForAll(
      decodedResponse.value,
    );
  }

  const title = useMemo(
    () =>
      getTitle(
        t as IntlFunction,
        currentConfirmation,
        isNFT,
        customSpendingCap,
        isRevokeSetApprovalForAll,
      ),
    [currentConfirmation, isNFT, customSpendingCap, isRevokeSetApprovalForAll],
  );

  const description = useMemo(
    () =>
      getDescription(
        t as IntlFunction,
        currentConfirmation,
        isNFT,
        customSpendingCap,
        isRevokeSetApprovalForAll,
      ),

    [currentConfirmation, isNFT, customSpendingCap, isRevokeSetApprovalForAll],
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
