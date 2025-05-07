import { TransactionType } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';
import {
  shouldUseRedesignForTransactions,
  shouldUseRedesignForSignatures,
} from './confirmation.utils';

describe('confirmation.utils', () => {
  describe('shouldUseRedesignForTransactions', () => {
    const supportedTransactionTypes = [
      TransactionType.contractInteraction,
      TransactionType.deployContract,
      TransactionType.tokenMethodApprove,
      TransactionType.tokenMethodIncreaseAllowance,
      TransactionType.tokenMethodSetApprovalForAll,
      TransactionType.tokenMethodTransfer,
      TransactionType.tokenMethodTransferFrom,
      TransactionType.tokenMethodSafeTransferFrom,
      TransactionType.simpleSend,
    ];

    const unsupportedTransactionType = TransactionType.swap;

    it('should return true for supported transaction types', () => {
      supportedTransactionTypes.forEach((transactionType) => {
        expect(
          shouldUseRedesignForTransactions({
            transactionMetadataType: transactionType,
          }),
        ).toBe(true);
      });
    });

    it('should return false for unsupported transaction types', () => {
      expect(
        shouldUseRedesignForTransactions({
          transactionMetadataType: unsupportedTransactionType,
        }),
      ).toBe(false);
    });
  });

  describe('shouldUseRedesignForSignatures', () => {
    const supportedSignatureApprovalTypes = [
      ApprovalType.EthSignTypedData,
      ApprovalType.PersonalSign,
    ];

    it('should return true for supported approval types', () => {
      supportedSignatureApprovalTypes.forEach((approvalType) => {
        expect(
          shouldUseRedesignForSignatures({
            approvalType,
          }),
        ).toBe(true);
      });
    });

    it('should return false for unsupported approval types', () => {
      const unsupportedApprovalType = ApprovalType.AddEthereumChain;

      expect(
        shouldUseRedesignForSignatures({
          approvalType: unsupportedApprovalType,
        }),
      ).toBe(false);
    });
  });
});
