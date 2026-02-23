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
import { Skeleton } from '../../../../../components/component-library/skeleton';
import {
  ConfirmationLoader,
  useConfirmationNavigationOptions,
} from '../../../hooks/useConfirmationNavigation';
import { CustomAmountInfoSkeleton } from '../../info/custom-amount-info';
import { MusdClaimInfo } from '../../info/musd-claim-info';
import { MusdConversionInfo } from './musd-conversion-info';
import { PerpsDepositInfo } from './perps-deposit-info';
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
  <>
    <Skeleton
      height="60px"
      width="60px"
      style={{
        marginTop: 32,
        marginBottom: 10,
        borderRadius: '50%',
        justifySelf: 'center',
        alignSelf: 'center',
      }}
    />
    <Skeleton
      height="32px"
      width="200px"
      style={{ marginBottom: 20, justifySelf: 'center', alignSelf: 'center' }}
    />
    <Skeleton
      height="72px"
      width="100%"
      style={{ marginBottom: 12 }}
      data-testid="confirmation__info_skeleton"
    />
    <Skeleton height="72px" width="100%" style={{ marginBottom: 12 }} />
    <Skeleton height="72px" width="100%" style={{ marginBottom: 12 }} />
  </>
);

const Info = () => {
  const { currentConfirmation } = useConfirmContext();
  const { loader } = useConfirmationNavigationOptions();

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
          const requestedPermissionType =
            signatureRequest.decodedPermission.permission.type;

          const enabledPermissions = getEnabledAdvancedPermissions();

          if (!enabledPermissions.includes(requestedPermissionType)) {
            // This should never happen, as `wallet_requestExecutionPermissions`
            // only accepts permissions of enabled types. This is here as a
            // security precaution, to ensure that permission types that are not
            // yet enabled are never available to sign.
            throw new Error(
              `Invalid eth_signTypedData_v4 request - Advanced Permission type: ${requestedPermissionType} not enabled`,
            );
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

      [TransactionType.musdClaim]: () => MusdClaimInfo,
      [TransactionType.musdConversion]: () => MusdConversionInfo,
      [TransactionType.perpsDeposit]: () => PerpsDepositInfo,
    }),
    [currentConfirmation],
  );

  if (!currentConfirmation?.type) {
    if (loader === ConfirmationLoader.CustomAmount) {
      return <CustomAmountInfoSkeleton />;
    }

    return <InfoSkeleton />;
  }

  const InfoComponent =
    ConfirmationInfoComponentMap[
      currentConfirmation?.type as keyof typeof ConfirmationInfoComponentMap
    ]();

  return <InfoComponent />;
};

export default Info;
