import { ApprovalType } from '@metamask/controller-utils';
import {
  NestedTransactionMetadata,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { LOWER_CASED_BURN_ADDRESSES } from '../../../constants/token';
import { useBurnAddressAlert } from './useBurnAddressAlert';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

const { useI18nContext } = jest.requireMock(
  '../../../../../hooks/useI18nContext',
);

const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' as Hex;
const REGULAR_ADDRESS = '0x1234567890123456789012345678901234567890' as Hex;
const BURN_ADDRESS_1 = LOWER_CASED_BURN_ADDRESSES[0] as Hex;
const BURN_ADDRESS_2 = LOWER_CASED_BURN_ADDRESSES[1] as Hex;

const mockT = (key: string) => key;

const createMockNestedTransaction = (
  to: Hex,
  data?: string,
  type?: TransactionType,
): NestedTransactionMetadata => ({
  data: (data || '0x') as Hex,
  to,
  value: '0x0',
  gas: '0x5208',
  type,
});

function runHook({
  currentConfirmation,
  nestedTransactions = [],
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  nestedTransactions?: NestedTransactionMetadata[];
} = {}) {
  const confirmation = currentConfirmation
    ? {
        ...genUnapprovedContractInteractionConfirmation({ chainId: '0x5' }),
        ...currentConfirmation,
        nestedTransactions,
      }
    : undefined;

  let pendingApprovals = {};
  if (confirmation) {
    pendingApprovals = {
      [confirmation.id as string]: {
        id: confirmation.id,
        type: ApprovalType.Transaction,
      },
    };
  }

  const state = getMockConfirmState({
    metamask: {
      pendingApprovals,
      transactions: confirmation ? [confirmation] : [],
    },
  });

  // Mock i18n
  useI18nContext.mockReturnValue(mockT);

  const response = renderHookWithConfirmContextProvider(
    useBurnAddressAlert,
    state,
  );

  return response.result.current;
}

describe('useBurnAddressAlert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('when no confirmation exists', () => {
    it('returns no alerts', () => {
      const alerts = runHook();
      expect(alerts).toEqual([]);
    });
  });

  describe('when recipient is not a burn address', () => {
    it('returns no alerts for regular address in txParams.to', () => {
      const alerts = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: REGULAR_ADDRESS,
          },
          type: TransactionType.simpleSend,
        },
      });

      expect(alerts).toEqual([]);
    });

    it('returns no alerts for regular address in nested transactions', () => {
      const nestedTransactions = [createMockNestedTransaction(REGULAR_ADDRESS)];

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
      });

      expect(alerts).toEqual([]);
    });

    it('returns no alerts when no recipients exist', () => {
      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
      });

      expect(alerts).toEqual([]);
    });
  });

  describe('when transactionMeta recipient is a burn address', () => {
    it('returns alert for first burn address (0x0...0)', () => {
      const alerts = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: BURN_ADDRESS_1,
          },
          type: TransactionType.simpleSend,
        },
      });

      expect(alerts).toEqual([
        {
          key: AlertActionKey.InteractingWith,
          field: RowAlertKey.InteractingWith,
          message: 'alertMessageBurnAddress',
          reason: 'alertActionBurnAddress',
          severity: Severity.Danger,
          isBlocking: true,
        },
      ]);
    });

    it('returns alert for second burn address (0x...dead)', () => {
      const alerts = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: BURN_ADDRESS_2,
          },
          type: TransactionType.simpleSend,
        },
      });

      expect(alerts).toEqual([
        {
          key: AlertActionKey.InteractingWith,
          field: RowAlertKey.InteractingWith,
          message: 'alertMessageBurnAddress',
          reason: 'alertActionBurnAddress',
          severity: Severity.Danger,
          isBlocking: true,
        },
      ]);
    });

    it('returns alert when burn address in txParams.to (uppercase)', () => {
      const alerts = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: BURN_ADDRESS_1.toUpperCase() as Hex,
          },
          type: TransactionType.simpleSend,
        },
      });

      expect(alerts).toEqual([
        {
          key: AlertActionKey.InteractingWith,
          field: RowAlertKey.InteractingWith,
          message: 'alertMessageBurnAddress',
          reason: 'alertActionBurnAddress',
          severity: Severity.Danger,
          isBlocking: true,
        },
      ]);
    });

    it('returns alert when burn address in txParams.to (mixed case)', () => {
      const mixedCaseBurnAddress =
        '0x0000000000000000000000000000000000000000'.replace(
          /0/gu,
          (_match, offset) => (offset % 2 === 0 ? '0' : '0'),
        );
      const alerts = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: mixedCaseBurnAddress as Hex,
          },
          type: TransactionType.simpleSend,
        },
      });

      expect(alerts).toEqual([
        {
          key: AlertActionKey.InteractingWith,
          field: RowAlertKey.InteractingWith,
          message: 'alertMessageBurnAddress',
          reason: 'alertActionBurnAddress',
          severity: Severity.Danger,
          isBlocking: true,
        },
      ]);
    });
  });

  describe('when nested transaction recipient is a burn address', () => {
    it('returns alert for burn address in single nested transaction', () => {
      const nestedTransactions = [createMockNestedTransaction(BURN_ADDRESS_1)];

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
      });

      expect(alerts).toEqual([
        {
          key: AlertActionKey.InteractingWith,
          field: RowAlertKey.InteractingWith,
          message: 'alertMessageBurnAddress',
          reason: 'alertActionBurnAddress',
          severity: Severity.Danger,
          isBlocking: true,
        },
      ]);
    });

    it('returns alert for burn address in multiple nested transactions', () => {
      const nestedTransactions = [
        createMockNestedTransaction(REGULAR_ADDRESS),
        createMockNestedTransaction(BURN_ADDRESS_1),
        createMockNestedTransaction(REGULAR_ADDRESS),
      ];

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
      });

      expect(alerts).toEqual([
        {
          key: AlertActionKey.InteractingWith,
          field: RowAlertKey.InteractingWith,
          message: 'alertMessageBurnAddress',
          reason: 'alertActionBurnAddress',
          severity: Severity.Danger,
          isBlocking: true,
        },
      ]);
    });

    it('returns alert when burn address in nested transaction (uppercase)', () => {
      const nestedTransactions = [
        createMockNestedTransaction(BURN_ADDRESS_2.toUpperCase() as Hex),
      ];

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
      });

      expect(alerts).toEqual([
        {
          key: AlertActionKey.InteractingWith,
          field: RowAlertKey.InteractingWith,
          message: 'alertMessageBurnAddress',
          reason: 'alertActionBurnAddress',
          severity: Severity.Danger,
          isBlocking: true,
        },
      ]);
    });

    it('returns no alerts when nested transactions exist but none have burn addresses', () => {
      const nestedTransactions = [
        createMockNestedTransaction(REGULAR_ADDRESS),
        createMockNestedTransaction(REGULAR_ADDRESS),
      ];

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
      });

      expect(alerts).toEqual([]);
    });
  });

  describe('when both transactionMeta and nested transaction have burn addresses', () => {
    it('returns single alert (not duplicated)', () => {
      const nestedTransactions = [createMockNestedTransaction(BURN_ADDRESS_2)];

      const alerts = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: BURN_ADDRESS_1,
          },
          type: TransactionType.simpleSend,
        },
        nestedTransactions,
      });

      expect(alerts).toEqual([
        {
          key: AlertActionKey.InteractingWith,
          field: RowAlertKey.InteractingWith,
          message: 'alertMessageBurnAddress',
          reason: 'alertActionBurnAddress',
          severity: Severity.Danger,
          isBlocking: true,
        },
      ]);
    });

    it('returns single alert when multiple nested transactions have burn addresses', () => {
      const nestedTransactions = [
        createMockNestedTransaction(BURN_ADDRESS_1),
        createMockNestedTransaction(BURN_ADDRESS_2),
      ];

      const alerts = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: BURN_ADDRESS_1,
          },
          type: TransactionType.simpleSend,
        },
        nestedTransactions,
      });

      expect(alerts).toEqual([
        {
          key: AlertActionKey.InteractingWith,
          field: RowAlertKey.InteractingWith,
          message: 'alertMessageBurnAddress',
          reason: 'alertActionBurnAddress',
          severity: Severity.Danger,
          isBlocking: true,
        },
      ]);
    });
  });

  describe('returns no alerts when', () => {
    it('undefined recipient', () => {
      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          type: TransactionType.contractInteraction,
        },
      });

      expect(alerts).toEqual([]);
    });

    it('empty nested transactions array', () => {
      const alerts = runHook({
        currentConfirmation: {
          txParams: {
            from: ACCOUNT_ADDRESS,
            to: REGULAR_ADDRESS,
          },
        },
        nestedTransactions: [],
      });

      expect(alerts).toEqual([]);
    });

    it('null/undefined values in nested transactions gracefully', () => {
      const nestedTransactions = [createMockNestedTransaction(REGULAR_ADDRESS)];

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
        },
        nestedTransactions,
      });

      expect(alerts).toEqual([]);
    });
  });
});
