import { ApprovalType } from '@metamask/controller-utils';
import React from 'react';
import { useTrustSignalMetrics } from '../../../../trust-signals/hooks/useTrustSignalMetrics';
import { useConfirmContext } from '../../../context/confirm';
import { useApprovalRequest } from '../../../hooks/useApprovalRequest';
import { useSmartTransactionFeatureFlags } from '../../../hooks/useSmartTransactionFeatureFlags';
import { useTransactionFocusEffect } from '../../../hooks/useTransactionFocusEffect';
import { AddEthereumChain } from '../../../external/add-ethereum-chain/add-ethereum-chain';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import SignatureInfo from './signature-info/signature-info';
import TransactionInfo from './transaction-info/transaction-info';

const SIGNATURE_APPROVAL_TYPES = [
  ApprovalType.EthSignTypedData,
  ApprovalType.PersonalSign,
];

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export const InfoSkeleton = () => (
  <ConfirmInfoSection data-testid="confirmation__info_skeleton">
    <Skeleton height="16px" width="30%" marginBottom={2} />
    <Skeleton height="48px" width="100%" />
  </ConfirmInfoSection>
);

const Info = () => {
  const { currentConfirmation } = useConfirmContext();
  const approvalRequest = useApprovalRequest();

  useSmartTransactionFeatureFlags();
  useTransactionFocusEffect();

  useTrustSignalMetrics();

  if (!currentConfirmation?.type) {
    return <InfoSkeleton />;
  }

  if (approvalRequest?.type === ApprovalType.AddEthereumChain) {
    return <AddEthereumChain />;
  }

  if (
    SIGNATURE_APPROVAL_TYPES.includes(approvalRequest?.type as ApprovalType)
  ) {
    return <SignatureInfo />;
  }

  return <TransactionInfo />;
};

export default Info;
