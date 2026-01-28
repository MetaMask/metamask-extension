import { ApprovalType } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import { AlertsName } from '../constants';
import { useSigningOrSubmittingAlerts } from './useSigningOrSubmittingAlerts';

const EXPECTED_ALERT = {
  isBlocking: true,
  key: AlertsName.SigningOrSubmitting,
  message: 'A previous transaction is still being signed or submitted',
  severity: Severity.Danger,
};
const EXPECTED_ALERT_PAY_TOKEN = {
  isBlocking: true,
  key: AlertsName.SigningOrSubmitting,
  message:
    'You have a pending transaction on this network. Wait for it to complete or select a token on another network.',
  severity: Severity.Danger,
};
const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TRANSACTION_ID_MOCK = '123-456';

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
}) as TransactionMeta;

const TRANSACTION_META_MOCK = {
  id: TRANSACTION_ID_MOCK,
  chainId: '0x5',
  networkClientId: 'testNetworkClientId',
  status: TransactionStatus.submitted,
  type: TransactionType.contractInteraction,
  txParams: {
    from: ACCOUNT_ADDRESS,
  },
  time: new Date().getTime() - 10000,
} as TransactionMeta;

function runHook({
  currentConfirmation,
  transactions = [],
  transactionData = {},
}: {
  currentConfirmation?: TransactionMeta;
  transactions?: TransactionMeta[];
  transactionData?: Record<string, unknown>;
} = {}) {
  let pendingApprovals = {};
  if (currentConfirmation) {
    pendingApprovals = {
      [currentConfirmation.id as string]: {
        id: currentConfirmation.id,
        type: ApprovalType.Transaction,
      },
    };
    transactions.push(currentConfirmation);
  }
  const state = getMockConfirmState({
    metamask: {
      pendingApprovals,
      transactions,
      transactionData,
    },
  });
  const response = renderHookWithConfirmContextProvider(
    useSigningOrSubmittingAlerts,
    state,
  );

  return response.result.current;
}

describe('useSigningOrSubmittingAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(
      runHook({
        currentConfirmation: undefined,
        transactions: [TRANSACTION_META_MOCK],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if no transactions', () => {
    expect(
      runHook({ currentConfirmation: CONFIRMATION_MOCK, transactions: [] }),
    ).toEqual([]);
  });

  it('returns alerts if transaction on different chain', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            status: TransactionStatus.approved,
            chainId: '0x6',
          },
        ],
      }),
    ).toEqual([EXPECTED_ALERT]);
  });

  it('returns no alerts if transaction has alternate status', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [
          { ...TRANSACTION_META_MOCK, status: TransactionStatus.submitted },
        ],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if confirmation has incorrect type', () => {
    expect(
      runHook({
        currentConfirmation: {
          ...CONFIRMATION_MOCK,
          type: TransactionType.signTypedData,
        },
        transactions: [TRANSACTION_META_MOCK],
      }),
    ).toEqual([]);
  });

  it('returns alert if signed transaction', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transactions: [
        { ...TRANSACTION_META_MOCK, status: TransactionStatus.signed },
      ],
    });

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });

  it('returns alert if approved transaction', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transactions: [
        { ...TRANSACTION_META_MOCK, status: TransactionStatus.approved },
      ],
    });

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });

  describe('pay token chain alerts', () => {
    const PAY_TOKEN_CHAIN_ID = '0x89';
    const CONFIRMATION_WITH_PAY_TOKEN =
      genUnapprovedContractInteractionConfirmation({
        chainId: '0x5',
      }) as TransactionMeta;

    it('returns pay token alert when pending transaction exists on pay token chain', () => {
      const transactionId = CONFIRMATION_WITH_PAY_TOKEN.id as string;
      const alerts = runHook({
        currentConfirmation: CONFIRMATION_WITH_PAY_TOKEN,
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            id: 'other-tx-id',
            chainId: PAY_TOKEN_CHAIN_ID,
            status: TransactionStatus.submitted,
            txParams: {
              from: CONFIRMATION_WITH_PAY_TOKEN.txParams?.from as string,
            },
          },
        ],
        transactionData: {
          [transactionId]: {
            paymentToken: {
              address: '0xtoken',
              chainId: PAY_TOKEN_CHAIN_ID,
            },
          },
        },
      });

      expect(alerts).toEqual([EXPECTED_ALERT_PAY_TOKEN]);
    });

    it('returns no alert when pay token is on same chain as transaction', () => {
      const transactionId = CONFIRMATION_WITH_PAY_TOKEN.id as string;
      const alerts = runHook({
        currentConfirmation: CONFIRMATION_WITH_PAY_TOKEN,
        transactions: [],
        transactionData: {
          [transactionId]: {
            paymentToken: {
              address: '0xtoken',
              chainId: '0x5',
            },
          },
        },
      });

      expect(alerts).toEqual([]);
    });

    it('returns no alert when no pending transactions on pay token chain', () => {
      const transactionId = CONFIRMATION_WITH_PAY_TOKEN.id as string;
      const alerts = runHook({
        currentConfirmation: CONFIRMATION_WITH_PAY_TOKEN,
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            id: 'other-tx-id',
            chainId: PAY_TOKEN_CHAIN_ID,
            status: TransactionStatus.confirmed,
            txParams: {
              from: CONFIRMATION_WITH_PAY_TOKEN.txParams?.from as string,
            },
          },
        ],
        transactionData: {
          [transactionId]: {
            paymentToken: {
              address: '0xtoken',
              chainId: PAY_TOKEN_CHAIN_ID,
            },
          },
        },
      });

      expect(alerts).toEqual([]);
    });

    it('returns no alert when pending transaction is from different account', () => {
      const transactionId = CONFIRMATION_WITH_PAY_TOKEN.id as string;
      const alerts = runHook({
        currentConfirmation: CONFIRMATION_WITH_PAY_TOKEN,
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            id: 'other-tx-id',
            chainId: PAY_TOKEN_CHAIN_ID,
            status: TransactionStatus.submitted,
            txParams: {
              from: '0xdifferentaccount',
            },
          },
        ],
        transactionData: {
          [transactionId]: {
            paymentToken: {
              address: '0xtoken',
              chainId: PAY_TOKEN_CHAIN_ID,
            },
          },
        },
      });

      expect(alerts).toEqual([]);
    });
  });
});
