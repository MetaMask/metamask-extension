import { UserOperationMetadata } from '@metamask/user-operation-controller';
import {
  AccountAbstractionState,
  getIsUsingPaymaster,
  getUserOperation,
  getUserOperations,
} from './account-abstraction';

const TRANSACTION_ID_MOCK = 'testTransactionId';

describe('Account Abstraction Selectors', () => {
  describe('getUserOperations', () => {
    it('returns user operations object', () => {
      const userOperations = {
        testUserOperationId: { id: 'testUserOperationId' },
      };

      const state = {
        metamask: {
          userOperations,
        },
      } as unknown as AccountAbstractionState;

      expect(getUserOperations(state)).toStrictEqual(userOperations);
    });

    it('returns empty object if undefined', () => {
      const state = {
        metamask: {},
      } as AccountAbstractionState;

      expect(getUserOperations(state)).toStrictEqual({});
    });
  });

  describe('getUserOperation', () => {
    it('returns undefined if no confirm transaction', () => {
      const state = {} as AccountAbstractionState;

      expect(getUserOperation(state)).toBeUndefined();
    });

    it('returns undefined if transaction is not user operation', () => {
      const state = {
        confirmTransaction: { txData: { isUserOperation: false } },
      } as AccountAbstractionState;

      expect(getUserOperation(state)).toBeUndefined();
    });

    it('returns undefined if no user operation matches transaction ID', () => {
      const state = {
        confirmTransaction: {
          txData: { isUserOperation: true, id: TRANSACTION_ID_MOCK },
        },
        metamask: {
          userOperations: {
            invalidId: { id: 'invalidId' },
          },
        },
      } as unknown as AccountAbstractionState;

      expect(getUserOperation(state)).toBeUndefined();
    });

    it('returns user operation if user operation matches transaction ID', () => {
      const userOperation = {
        id: TRANSACTION_ID_MOCK,
      } as UserOperationMetadata;

      const state = {
        confirmTransaction: {
          txData: { isUserOperation: true, id: TRANSACTION_ID_MOCK },
        },
        metamask: {
          userOperations: {
            [TRANSACTION_ID_MOCK]: userOperation,
          },
        },
      } as unknown as AccountAbstractionState;

      expect(getUserOperation(state)).toStrictEqual(userOperation);
    });
  });

  describe('getIsUsingPaymaster', () => {
    it('returns false if no user operation', () => {
      const state = {} as AccountAbstractionState;

      expect(getIsUsingPaymaster(state)).toBe(false);
    });

    it('returns false if no paymaster data', () => {
      const state = {
        confirmTransaction: {
          txData: { isUserOperation: true, id: TRANSACTION_ID_MOCK },
        },
        metamask: {
          userOperations: {
            [TRANSACTION_ID_MOCK]: {
              userOperation: { paymasterAndData: undefined },
            },
          },
        },
      } as unknown as AccountAbstractionState;

      expect(getIsUsingPaymaster(state)).toBe(false);
    });

    it('returns false if empty paymaster data', () => {
      const state = {
        confirmTransaction: {
          txData: { isUserOperation: true, id: TRANSACTION_ID_MOCK },
        },
        metamask: {
          userOperations: {
            [TRANSACTION_ID_MOCK]: {
              userOperation: { paymasterAndData: '0x' },
            },
          },
        },
      } as unknown as AccountAbstractionState;

      expect(getIsUsingPaymaster(state)).toBe(false);
    });

    it('returns true if paymaster data', () => {
      const state = {
        confirmTransaction: {
          txData: { isUserOperation: true, id: TRANSACTION_ID_MOCK },
        },
        metamask: {
          userOperations: {
            [TRANSACTION_ID_MOCK]: {
              userOperation: { paymasterAndData: '0x123' },
            },
          },
        },
      } as unknown as AccountAbstractionState;

      expect(getIsUsingPaymaster(state)).toBe(true);
    });
  });
});
