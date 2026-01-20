import { TransactionType } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';
import React, { useMemo } from 'react';
import { getEnabledAdvancedPermissions } from '../../../../../../shared/modules/environment';
import { useTrustSignalMetrics } from '../../../../trust-signals/hooks/useTrustSignalMetrics';
import { useConfirmContext } from '../../../context/confirm';
import { useSmartTransactionFeatureFlags } from '../../../hooks/useSmartTransactionFeatureFlags';
import { useTransactionFocusEffect } from '../../../hooks/useTransactionFocusEffect';
import { SignatureRequestType } from '../../../types/confirm';
import { AddEthereumChain } from '../../../external/add-ethereum-chain/add-ethereum-chain';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import ApproveInfo from './approve/approve';
import BaseTransactionInfo from './base-transaction-info/base-transaction-info';
import NativeTransferInfo from './native-transfer/native-transfer';
import NFTTokenTransferInfo from './nft-token-transfer/nft-token-transfer';
import PersonalSignInfo from './personal-sign/personal-sign';
import SetApprovalForAllInfo from './set-approval-for-all-info/set-approval-for-all-info';
import ShieldSubscriptionApproveInfo from './shield-subscription-approve/shield-subscription-approve';
import TokenTransferInfo from './token-transfer/token-transfer';
import TypedSignV1Info from './typed-sign-v1/typed-sign-v1';
import TypedSignInfo from './typed-sign/typed-sign';
import TypedSignPermissionInfo from './typed-sign/typed-sign-permission';

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

  // TODO: Create TransactionInfo and SignatureInfo components.
  useSmartTransactionFeatureFlags();
  useTransactionFocusEffect();

  useTrustSignalMetrics();

  const ConfirmationInfoComponentMap = useMemo(
    () => ({
      [TransactionType.batch]: () => BaseTransactionInfo,
      [TransactionType.contractInteraction]: () => BaseTransactionInfo,
      [TransactionType.deployContract]: () => BaseTransactionInfo,
      [TransactionType.personalSign]: () => PersonalSignInfo,
      [TransactionType.revokeDelegation]: () => BaseTransactionInfo,
      [TransactionType.simpleSend]: () => NativeTransferInfo,
      [TransactionType.shieldSubscriptionApprove]: () =>
        ShieldSubscriptionApproveInfo,
      [TransactionType.signTypedData]: () => {
        const signatureRequest = currentConfirmation as SignatureRequestType;

        const { version } = signatureRequest?.msgParams ?? {};
        if (version === 'V1') {
          return TypedSignV1Info;
        }
        if (signatureRequest?.decodedPermission) {
          if (getEnabledAdvancedPermissions().length === 0) {
            throw new Error('Gator permissions feature is not enabled');
          }

          return TypedSignPermissionInfo;
        }
        return TypedSignInfo;
      },
      [TransactionType.tokenMethodApprove]: () => ApproveInfo,
      [TransactionType.tokenMethodIncreaseAllowance]: () => ApproveInfo,
      [TransactionType.tokenMethodSafeTransferFrom]: () => NFTTokenTransferInfo,
      [TransactionType.tokenMethodSetApprovalForAll]: () =>
        SetApprovalForAllInfo,
      [TransactionType.tokenMethodTransfer]: () => TokenTransferInfo,
      [TransactionType.tokenMethodTransferFrom]: () => NFTTokenTransferInfo,

      [ApprovalType.AddEthereumChain]: () => AddEthereumChain,
    }),
    [currentConfirmation],
  );

  if (!currentConfirmation?.type) {
    return <InfoSkeleton />;
  }

  const InfoComponent =
    ConfirmationInfoComponentMap[
      currentConfirmation?.type as keyof typeof ConfirmationInfoComponentMap
    ]();

  return <InfoComponent />;
};

export default Info;
