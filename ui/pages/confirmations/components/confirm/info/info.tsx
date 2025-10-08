/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionType } from '@metamask/transaction-controller';
import React from 'react';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { useSmartTransactionFeatureFlags } from '../../../hooks/useSmartTransactionFeatureFlags';
import { useTransactionFocusEffect } from '../../../hooks/useTransactionFocusEffect';
import { useTrustSignalMetrics } from '../../../../trust-signals/hooks/useTrustSignalMetrics';
import { isGatorPermissionsFeatureEnabled } from '../../../../../../shared/modules/environment';
import { useUnapprovedTransactionWithFallback } from '../../../hooks/transactions/useUnapprovedTransaction';
import { useSignatureRequestWithFallback } from '../../../hooks/signatures/useSignatureRequest';
import { useApprovalRequest } from '../../../hooks/useApprovalRequest';
import ApproveInfo from './approve/approve';
import BaseTransactionInfo from './base-transaction-info/base-transaction-info';
import NFTTokenTransferInfo from './nft-token-transfer/nft-token-transfer';
import PersonalSignInfo from './personal-sign/personal-sign';
import SetApprovalForAllInfo from './set-approval-for-all-info/set-approval-for-all-info';
import TokenTransferInfo from './token-transfer/token-transfer';
import TypedSignV1Info from './typed-sign-v1/typed-sign-v1';
import TypedSignInfo from './typed-sign/typed-sign';
import TypedSignPermissionInfo from './typed-sign/typed-sign-permission';

const Info = () => {
  const approvalRequest = useApprovalRequest();

  useTrustSignalMetrics();

  if (!approvalRequest) {
    return null;
  }

  if (approvalRequest.type === ApprovalType.Transaction) {
    return <TransactionInfo />;
  }

  if (
    [ApprovalType.PersonalSign, ApprovalType.EthSignTypedData].includes(
      approvalRequest.type as ApprovalType,
    )
  ) {
    return <SignatureInfo />;
  }

  return null;
};

function TransactionInfo() {
  const transactionMeta = useUnapprovedTransactionWithFallback();

  useSmartTransactionFeatureFlags();
  useTransactionFocusEffect();

  switch (transactionMeta.type) {
    case TransactionType.tokenMethodApprove:
    case TransactionType.tokenMethodIncreaseAllowance:
      return <ApproveInfo />;
    case TransactionType.tokenMethodSafeTransferFrom:
    case TransactionType.tokenMethodTransferFrom:
      return <NFTTokenTransferInfo />;
    case TransactionType.tokenMethodSetApprovalForAll:
      return <SetApprovalForAllInfo />;
    case TransactionType.tokenMethodTransfer:
      return <TokenTransferInfo />;
    default:
      return <BaseTransactionInfo />;
  }
}

function SignatureInfo() {
  const signatureRequest = useSignatureRequestWithFallback();

  if (signatureRequest.type === TransactionType.personalSign) {
    return <PersonalSignInfo />;
  }

  const { version } = signatureRequest.msgParams ?? {};

  if (version === SignTypedDataVersion.V1) {
    return <TypedSignV1Info />;
  }

  if (signatureRequest?.decodedPermission) {
    if (!isGatorPermissionsFeatureEnabled()) {
      throw new Error('Gator permissions feature is not enabled');
    }

    return <TypedSignPermissionInfo />;
  }

  return <TypedSignInfo />;
}

export default Info;
