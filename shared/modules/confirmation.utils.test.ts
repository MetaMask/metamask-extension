import { TransactionType } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';
import {
  REDESIGN_APPROVAL_TYPES,
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

    describe('when user setting is enabled', () => {
      it('should return true for supported transaction types', () => {
        supportedTransactionTypes.forEach((transactionType) => {
          expect(
            shouldUseRedesignForTransactions(
              transactionType,
              true, // user setting enabled
              false, // developer mode disabled
            ),
          ).toBe(true);
        });
      });

      it('should return false for unsupported transaction types', () => {
        expect(
          shouldUseRedesignForTransactions(
            unsupportedTransactionType,
            true, // user setting enabled
            false, // developer mode disabled
          ),
        ).toBe(false);
      });
    });

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
            shouldUseRedesignForTransactions(
              transactionType,
              false, // user setting disabled
              false, // developer setting disabled
            ),
          ).toBe(true);
        });
      });

      it('should return true for supported transaction types when developer setting is enabled', () => {
        supportedTransactionTypes.forEach((transactionType) => {
          expect(
            shouldUseRedesignForTransactions(
              transactionType,
              false, // user setting disabled
              true, // developer setting enabled
            ),
          ).toBe(true);
        });
      });

      it('should return false for unsupported transaction types even if developer mode is enabled', () => {
        process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';

        expect(
          shouldUseRedesignForTransactions(
            unsupportedTransactionType,
            false, // user setting disabled
            true, // developer setting enabled
          ),
        ).toBe(false);
      });
    });

    describe('when both user setting and developer mode are disabled', () => {
      const originalEnv = process.env;

      beforeEach(() => {
        process.env = { ...originalEnv };
        process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';
      });

      afterEach(() => {
        process.env = originalEnv;
      });

      it('should return false for all transaction types', () => {
        [...supportedTransactionTypes, unsupportedTransactionType].forEach(
          (transactionType) => {
            expect(
              shouldUseRedesignForTransactions(
                transactionType,
                false, // user setting disabled
                false, // developer setting disabled
              ),
            ).toBe(false);
          },
        );
      });
    });
  });

  describe('shouldUseRedesignForSignatures', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return true for supported approval types when user setting is enabled', () => {
      REDESIGN_APPROVAL_TYPES.forEach((approvalType) => {
        expect(
          shouldUseRedesignForSignatures(
            approvalType,
            true, // user setting enabled
            false, // developer setting disabled
          ),
        ).toBe(true);
      });
    });

    it('should return true for supported approval types when developer mode is enabled via env', () => {
      process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';

      REDESIGN_APPROVAL_TYPES.forEach((approvalType) => {
        expect(
          shouldUseRedesignForSignatures(
            approvalType,
            false, // user setting disabled
            false, // developer setting disabled
          ),
        ).toBe(true);
      });
    });

    it('should return true for supported approval types when developer setting is enabled', () => {
      REDESIGN_APPROVAL_TYPES.forEach((approvalType) => {
        expect(
          shouldUseRedesignForSignatures(
            approvalType,
            false, // user setting disabled
            true, // developer setting enabled
          ),
        ).toBe(true);
      });
    });

    it('should return false for unsupported approval types', () => {
      const unsupportedApprovalType = ApprovalType.AddEthereumChain;

      expect(
        shouldUseRedesignForSignatures(
          unsupportedApprovalType,
          true, // user setting enabled
          true, // developer setting enabled
        ),
      ).toBe(false);
    });

    it('should return false when both user setting and developer mode are disabled', () => {
      process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';

      REDESIGN_APPROVAL_TYPES.forEach((approvalType) => {
        expect(
          shouldUseRedesignForSignatures(
            approvalType,
            false, // user setting disabled
            false, // developer setting disabled
          ),
        ).toBe(false);
      });
    });
  });
});
