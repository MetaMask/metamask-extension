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

    describe('when developer mode is enabled', () => {
      const originalEnv = process.env;

      beforeEach(() => {
        process.env = { ...originalEnv };
      });

      afterEach(() => {
        process.env = originalEnv;
      });

      it('should return true for supported transaction types when ENABLE_CONFIRMATION_REDESIGN is true', () => {
        process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';

        supportedTransactionTypes.forEach((transactionType) => {
          expect(
            shouldUseRedesignForTransactions({
              transactionMetadataType: transactionType,
              isRedesignedConfirmationsDeveloperEnabled: false, // developer setting disabled
            }),
          ).toBe(true);
        });
      });

      it('should return true for supported transaction types when developer setting is enabled', () => {
        supportedTransactionTypes.forEach((transactionType) => {
          expect(
            shouldUseRedesignForTransactions({
              transactionMetadataType: transactionType,
              isRedesignedConfirmationsDeveloperEnabled: true, // developer setting enabled
            }),
          ).toBe(true);
        });
      });

      it('should return false for unsupported transaction types even if developer mode is enabled', () => {
        process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';

        expect(
          shouldUseRedesignForTransactions({
            transactionMetadataType: unsupportedTransactionType,
            isRedesignedConfirmationsDeveloperEnabled: true, // developer setting enabled
          }),
        ).toBe(false);
      });
    });
  });

  describe('shouldUseRedesignForSignatures', () => {
    const originalEnv = process.env;

    const supportedSignatureApprovalTypes = [
      ApprovalType.EthSignTypedData,
      ApprovalType.PersonalSign,
    ];

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return true for supported approval types when user setting is enabled', () => {
      supportedSignatureApprovalTypes.forEach((approvalType) => {
        expect(
          shouldUseRedesignForSignatures({
            approvalType,
            isRedesignedSignaturesUserSettingEnabled: true, // user setting enabled
            isRedesignedConfirmationsDeveloperEnabled: false, // developer setting disabled
          }),
        ).toBe(true);
      });
    });

    it('should return true for supported approval types when developer mode is enabled via env', () => {
      process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';

      supportedSignatureApprovalTypes.forEach((approvalType) => {
        expect(
          shouldUseRedesignForSignatures({
            approvalType,
            isRedesignedSignaturesUserSettingEnabled: false, // user setting disabled
            isRedesignedConfirmationsDeveloperEnabled: false, // developer setting disabled
          }),
        ).toBe(true);
      });
    });

    it('should return true for supported approval types when developer setting is enabled', () => {
      supportedSignatureApprovalTypes.forEach((approvalType) => {
        expect(
          shouldUseRedesignForSignatures({
            approvalType,
            isRedesignedSignaturesUserSettingEnabled: false, // user setting disabled
            isRedesignedConfirmationsDeveloperEnabled: true, // developer setting enabled
          }),
        ).toBe(true);
      });
    });

    it('should return false for unsupported approval types', () => {
      const unsupportedApprovalType = ApprovalType.AddEthereumChain;

      expect(
        shouldUseRedesignForSignatures({
          approvalType: unsupportedApprovalType,
          isRedesignedSignaturesUserSettingEnabled: true, // user setting enabled
          isRedesignedConfirmationsDeveloperEnabled: true, // developer setting enabled
        }),
      ).toBe(false);
    });

    it('should return false when both user setting and developer mode are disabled', () => {
      process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';

      supportedSignatureApprovalTypes.forEach((approvalType) => {
        expect(
          shouldUseRedesignForSignatures({
            approvalType,
            isRedesignedSignaturesUserSettingEnabled: false, // user setting disabled
            isRedesignedConfirmationsDeveloperEnabled: false, // developer setting disabled
          }),
        ).toBe(false);
      });
    });
  });
});
