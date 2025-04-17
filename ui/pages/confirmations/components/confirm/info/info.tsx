import { TransactionType } from '@metamask/transaction-controller';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useMemo } from 'react';
import { useConfirmContext } from '../../../context/confirm';
import { SignatureRequestType } from '../../../types/confirm';
import { useSmartTransactionFeatureFlags } from '../../../hooks/useSmartTransactionFeatureFlags';
import { useTransactionFocusEffect } from '../../../hooks/useTransactionFocusEffect';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import ApproveInfo from './approve/approve';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import BaseTransactionInfo from './base-transaction-info/base-transaction-info';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import NativeTransferInfo from './native-transfer/native-transfer';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import NFTTokenTransferInfo from './nft-token-transfer/nft-token-transfer';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonalSignInfo from './personal-sign/personal-sign';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import SetApprovalForAllInfo from './set-approval-for-all-info/set-approval-for-all-info';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import TokenTransferInfo from './token-transfer/token-transfer';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import TypedSignV1Info from './typed-sign-v1/typed-sign-v1';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import TypedSignInfo from './typed-sign/typed-sign';

const Info = () => {
  const { currentConfirmation } = useConfirmContext();

  // TODO: Create TransactionInfo and SignatureInfo components.
  useSmartTransactionFeatureFlags();
  useTransactionFocusEffect();

  const ConfirmationInfoComponentMap = useMemo(
    () => ({
      [TransactionType.batch]: () => BaseTransactionInfo,
      [TransactionType.contractInteraction]: () => BaseTransactionInfo,
      [TransactionType.deployContract]: () => BaseTransactionInfo,
      [TransactionType.personalSign]: () => PersonalSignInfo,
      [TransactionType.revokeDelegation]: () => BaseTransactionInfo,
      [TransactionType.simpleSend]: () => NativeTransferInfo,
      [TransactionType.signTypedData]: () => {
        const { version } =
          (currentConfirmation as SignatureRequestType)?.msgParams ?? {};
        if (version === 'V1') {
          return TypedSignV1Info;
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
    }),
    [currentConfirmation],
  );

  if (!currentConfirmation?.type) {
    return null;
  }

  const InfoComponent =
    ConfirmationInfoComponentMap[
      currentConfirmation?.type as keyof typeof ConfirmationInfoComponentMap
    ]();

  return <InfoComponent />;
};

export default Info;
