import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';
import React, { useMemo } from 'react';
import { Skeleton } from '@metamask/design-system-react';
import { mmLazy } from '../../../../../helpers/utils/mm-lazy';
import { CustomAmountInfoSkeleton } from '../../info/custom-amount-info/custom-amount-info-skeleton';
import { getConfirmationTransactionType } from '../../../utils/confirm';
import { useEnabledAdvancedPermissions } from '../../../../../hooks/gator-permissions/useEnabledAdvancedPermissions';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { useTrustSignalMetrics } from '../../../../trust-signals/hooks/useTrustSignalMetrics';
import { useConfirmContext } from '../../../context/confirm';
import { useSmartTransactionFeatureFlags } from '../../../hooks/useSmartTransactionFeatureFlags';
import { useTransactionFocusEffect } from '../../../hooks/useTransactionFocusEffect';
import { SignatureRequestType } from '../../../types/confirm';
import {
  ConfirmationLoader,
  useConfirmationNavigationOptions,
} from '../../../hooks/useConfirmationNavigation';
import ApproveInfo from './approve/approve';
import BaseTransactionInfo from './base-transaction-info/base-transaction-info';
import NativeTransferInfo from './native-transfer/native-transfer';
import NFTTokenTransferInfo from './nft-token-transfer/nft-token-transfer';
import SetApprovalForAllInfo from './set-approval-for-all-info/set-approval-for-all-info';
import TokenTransferInfo from './token-transfer/token-transfer';

// Keep common transaction details in the confirmation chunk. Specialized
// confirmations load their details only when that request type is displayed.
const AddEthereumChain = mmLazy(
  () => import('../../../external/add-ethereum-chain/add-ethereum-chain'),
);
const MoneyAccountDepositInfo = mmLazy(
  () => import('../../info/money-account-deposit-info'),
);
const MoneyAccountWithdrawInfo = mmLazy(
  () => import('../../info/money-account-withdraw-info'),
);
const MusdConversionInfo = mmLazy(
  () => import('../../info/musd-conversion-info/musd-conversion-info'),
);
const PerpsDepositInfo = mmLazy(() => import('./perps-deposit-info'));
const PerpsWithdrawInfo = mmLazy(() => import('./perps-withdraw-info'));
const PersonalSignInfo = mmLazy(() => import('./personal-sign/personal-sign'));
const ShieldSubscriptionApproveInfo = mmLazy(
  () => import('./shield-subscription-approve/shield-subscription-approve'),
);
const TypedSignV1Info = mmLazy(() => import('./typed-sign-v1/typed-sign-v1'));
const TypedSignInfo = mmLazy(() => import('./typed-sign/typed-sign'));
const TypedSignPermissionInfo = mmLazy(
  () => import('./typed-sign/typed-sign-permission'),
);

const DefaultHeadingSkeleton = () => (
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
  </>
);

const SendHeadingSkeleton = () => (
  <div
    data-testid="confirmation__send_info_skeleton"
    style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '16px',
      marginBottom: '8px',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton height="20px" width="60px" />
      <Skeleton height="32px" width="200px" />
      <Skeleton height="20px" width="80px" />
    </div>
    <Skeleton height="40px" width="40px" style={{ borderRadius: '50%' }} />
  </div>
);

const SectionSkeletons = () => (
  <>
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

export const InfoSkeleton = ({
  variant,
}: {
  variant?: ConfirmationLoader.Send;
}) => (
  <>
    {variant === ConfirmationLoader.Send ? (
      <SendHeadingSkeleton />
    ) : (
      <DefaultHeadingSkeleton />
    )}
    <SectionSkeletons />
  </>
);

const Info = () => {
  const { currentConfirmation } = useConfirmContext();
  const { loader } = useConfirmationNavigationOptions();
  const enabledPermissions = useEnabledAdvancedPermissions();

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

      [TransactionType.moneyAccountDeposit]: () => MoneyAccountDepositInfo,
      [TransactionType.moneyAccountWithdraw]: () => MoneyAccountWithdrawInfo,
      // Merkl claiming was removed (MUSD-1223); the type stays mapped so a claim
      // still in flight across the upgrade renders instead of throwing here.
      [TransactionType.musdClaim]: () => BaseTransactionInfo,
      [TransactionType.musdConversion]: () => MusdConversionInfo,
      [TransactionType.perpsDeposit]: () => PerpsDepositInfo,
      [TransactionType.perpsWithdraw]: () => PerpsWithdrawInfo,
    }),
    [currentConfirmation, enabledPermissions],
  );

  if (!currentConfirmation?.type) {
    if (loader === ConfirmationLoader.CustomAmount) {
      return <CustomAmountInfoSkeleton />;
    }

    return (
      <InfoSkeleton
        variant={
          loader === ConfirmationLoader.Send
            ? ConfirmationLoader.Send
            : undefined
        }
      />
    );
  }

  // Mirrors mobile's info-root routing.
  const confirmationType = getConfirmationTransactionType(
    currentConfirmation as TransactionMeta,
  );

  const InfoComponent =
    ConfirmationInfoComponentMap[
      confirmationType as keyof typeof ConfirmationInfoComponentMap
    ]();

  return <InfoComponent />;
};

export default Info;
