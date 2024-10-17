import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { memo, useMemo } from 'react';

import { TokenStandard } from '../../../../../../shared/constants/transaction';
import GeneralAlert from '../../../../../components/app/alert-system/general-alert/general-alert';
import { Box, Text } from '../../../../../components/component-library';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TypedSignSignaturePrimaryTypes } from '../../../constants';
import { useConfirmContext } from '../../../context/confirm';
import { Confirmation, SignatureRequestType } from '../../../types/confirm';
import { isSIWESignatureRequest } from '../../../utils';
import { useTypedSignSignatureInfo } from '../../../hooks/useTypedSignSignatureInfo';
import { useIsNFT } from '../info/approve/hooks/use-is-nft';
import { useDecodedTransactionData } from '../info/hooks/useDecodedTransactionData';
import { getIsRevokeSetApprovalForAll } from '../info/utils';
import { useCurrentSpendingCap } from './hooks/useCurrentSpendingCap';

function ConfirmBannerAlert({ ownerId }: { ownerId: string }) {
  const { generalAlerts } = useAlerts(ownerId);

  if (generalAlerts.length === 0) {
    return null;
  }

  return (
    <Box marginTop={3}>
      {generalAlerts.map((alert) => (
        <Box marginTop={1} key={alert.key}>
          <GeneralAlert
            data-testid="confirm-banner-alert"
            title={alert.reason}
            description={alert.message}
            severity={alert.severity}
            provider={alert.provider}
            details={alert.alertDetails}
            reportUrl={alert.reportUrl}
          />
        </Box>
      ))}
    </Box>
  );
}

type IntlFunction = (str: string) => string;

// todo: getTitle and getDescription can be merged to remove code duplication.

const getTitle = (
  t: IntlFunction,
  confirmation?: Confirmation,
  isNFT?: boolean,
  customSpendingCap?: string,
  isRevokeSetApprovalForAll?: boolean,
  pending?: boolean,
  primaryType?: keyof typeof TypedSignSignaturePrimaryTypes,
  tokenStandard?: string,
) => {
  if (pending) {
    return '';
  }

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
      if (primaryType === TypedSignSignaturePrimaryTypes.PERMIT) {
        if (tokenStandard === TokenStandard.ERC721) {
          return t('setApprovalForAllRedesignedTitle');
        }
        return t('confirmTitlePermitTokens');
      }
      return t('confirmTitleSignature');
    case TransactionType.tokenMethodApprove:
      if (isNFT) {
        return t('confirmTitleApproveTransaction');
      }
      if (customSpendingCap === '0') {
        return t('confirmTitleRevokeApproveTransaction');
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
  pending?: boolean,
  primaryType?: keyof typeof TypedSignSignaturePrimaryTypes,
  tokenStandard?: string,
) => {
  if (pending) {
    return '';
  }

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
      if (primaryType === TypedSignSignaturePrimaryTypes.PERMIT) {
        if (tokenStandard === TokenStandard.ERC721) {
          return t('confirmTitleDescApproveTransaction');
        }
        return t('confirmTitleDescPermitSignature');
      }
      return t('confirmTitleDescSign');
    case TransactionType.tokenMethodApprove:
      if (isNFT) {
        return t('confirmTitleDescApproveTransaction');
      }
      if (customSpendingCap === '0') {
        return '';
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

const ConfirmTitle: React.FC = memo(() => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const { isNFT } = useIsNFT(currentConfirmation as TransactionMeta);

  const { primaryType, tokenStandard } = useTypedSignSignatureInfo(
    currentConfirmation as SignatureRequestType,
  );

  const { customSpendingCap, pending: spendingCapPending } =
    useCurrentSpendingCap(currentConfirmation);

  let isRevokeSetApprovalForAll = false;
  let revokePending = false;
  if (
    currentConfirmation?.type === TransactionType.tokenMethodSetApprovalForAll
  ) {
    const decodedResponse = useDecodedTransactionData();

    isRevokeSetApprovalForAll = getIsRevokeSetApprovalForAll(
      decodedResponse.value,
    );
    revokePending = decodedResponse.pending;
  }

  const title = useMemo(
    () =>
      getTitle(
        t as IntlFunction,
        currentConfirmation,
        isNFT,
        customSpendingCap,
        isRevokeSetApprovalForAll,
        spendingCapPending || revokePending,
        primaryType,
        tokenStandard,
      ),
    [
      currentConfirmation,
      isNFT,
      customSpendingCap,
      isRevokeSetApprovalForAll,
      spendingCapPending,
      revokePending,
      primaryType,
      tokenStandard,
    ],
  );

  const description = useMemo(
    () =>
      getDescription(
        t as IntlFunction,
        currentConfirmation,
        isNFT,
        customSpendingCap,
        isRevokeSetApprovalForAll,
        spendingCapPending || revokePending,
        primaryType,
        tokenStandard,
      ),
    [
      currentConfirmation,
      isNFT,
      customSpendingCap,
      isRevokeSetApprovalForAll,
      spendingCapPending,
      revokePending,
      primaryType,
      tokenStandard,
    ],
  );

  if (!currentConfirmation) {
    return null;
  }

  return (
    <>
      <ConfirmBannerAlert ownerId={currentConfirmation.id} />
      {title !== '' && (
        <Text
          variant={TextVariant.headingLg}
          paddingTop={4}
          paddingBottom={4}
          textAlign={TextAlign.Center}
        >
          {title}
        </Text>
      )}
      {description !== '' && (
        <Text
          paddingBottom={4}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Center}
        >
          {description}
        </Text>
      )}
    </>
  );
});

export default ConfirmTitle;
