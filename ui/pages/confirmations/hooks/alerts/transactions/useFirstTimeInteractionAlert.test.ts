import { ApprovalType } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useFirstTimeInteractionAlert } from './useFirstTimeInteractionAlert';

const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TRANSACTION_ID_MOCK = '123-456';

const TRANSACTION_META_MOCK = {
  id: TRANSACTION_ID_MOCK,
  chainId: '0x5',
  status: TransactionStatus.unapproved,
  type: TransactionType.contractInteraction,
  txParams: {
    from: ACCOUNT_ADDRESS,
  },
  time: new Date().getTime() - 10000,
} as TransactionMeta;

function runHook({
  currentConfirmation,
  internalAccountAddresses,
}: {
  currentConfirmation?: TransactionMeta;
  internalAccountAddresses?: string[];
} = {}) {
  const pendingApprovals = currentConfirmation
    ? {
        [currentConfirmation.id as string]: {
          id: currentConfirmation.id,
          type: ApprovalType.Transaction,
        },
      }
    : {};

  const transactions = currentConfirmation ? [currentConfirmation] : [];

  const internalAccounts = {
    accounts: internalAccountAddresses?.map((address) => ({ address })) ?? [],
  };

  const state = getMockConfirmState({
    metamask: {
      internalAccounts,
      pendingApprovals,
      transactions,
    },
  });

  const response = renderHookWithConfirmContextProvider(
    useFirstTimeInteractionAlert,
    state,
  );

  return response.result.current;
}

describe('useFirstTimeInteractionAlert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if firstTimeInteraction is false', () => {
    const notFirstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: false,
    };
    expect(
      runHook({
        currentConfirmation: notFirstTimeConfirmation,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if firstTimeInteraction is undefined', () => {
    const notFirstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: undefined,
    };
    expect(
      runHook({
        currentConfirmation: notFirstTimeConfirmation,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction destination is internal account', () => {
    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: ACCOUNT_ADDRESS,
      },
    };
    expect(
      runHook({
        currentConfirmation: firstTimeConfirmation,
        internalAccountAddresses: [ACCOUNT_ADDRESS],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction destination is internal account with different case', () => {
    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: ACCOUNT_ADDRESS.toLowerCase(),
      },
    };
    expect(
      runHook({
        currentConfirmation: firstTimeConfirmation,
        internalAccountAddresses: [ACCOUNT_ADDRESS.toUpperCase()],
      }),
    ).toEqual([]);
  });

  it('returns alert if isFirstTimeInteraction is true', () => {
    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
    };
    const alerts = runHook({
      currentConfirmation: firstTimeConfirmation,
    });

    expect(alerts).toEqual([
      {
        actions: [],
        field: RowAlertKey.FirstTimeInteraction,
        isBlocking: false,
        key: 'firstTimeInteractionTitle',
        message:
          "You're interacting with this address for the first time. Make sure that it's correct before you continue.",
        reason: '1st interaction',
        severity: Severity.Warning,
      },
    ]);
  });
});
