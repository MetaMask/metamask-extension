import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../test/data/confirmations/token-transfer';
import {
  TrustSignalDisplayState,
  useTrustSignal,
} from '../../../../../hooks/useTrustSignals';
import { getExperience } from '../../../../../../shared/constants/verification';
import { EXPERIENCES_TYPE } from '../../../../../../shared/constants/first-party-contracts';
import { useFirstTimeInteractionAlert } from './useFirstTimeInteractionAlert';

jest.mock('../../../../../hooks/useTrustSignals', () => {
  const actual = jest.requireActual('../../../../../hooks/useTrustSignals');
  return {
    ...actual,
    useTrustSignal: jest.fn(),
  };
});

jest.mock('../../../../../../shared/constants/verification', () => ({
  ...jest.requireActual('../../../../../../shared/constants/verification'),
  getExperience: jest.fn(),
}));

const ACCOUNT_ADDRESS_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const ACCOUNT_ADDRESS_2_MOCK = '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b';
const CONTRACT_ADDRESS_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7be';
const TRANSACTION_ID_MOCK = '123-456';

const TRANSACTION_META_MOCK = {
  id: TRANSACTION_ID_MOCK,
  chainId: '0x5',
  networkClientId: 'testNetworkClientId',
  status: TransactionStatus.unapproved,
  type: TransactionType.contractInteraction,
  txParams: {
    from: ACCOUNT_ADDRESS_MOCK,
  },
  time: new Date().getTime() - 10000,
} as TransactionMeta;

jest.mock('../../../../../hooks/useTrustSignals', () => {
  const actual = jest.requireActual('../../../../../hooks/useTrustSignals');
  return {
    ...actual,
    useTrustSignal: jest.fn(),
  };
});

function runHook({
  currentConfirmation,
  internalAccountAddresses,
}: {
  currentConfirmation?: TransactionMeta;
  internalAccountAddresses?: string[];
} = {}) {
  const internalAccounts = {
    accounts: internalAccountAddresses?.map((address) => ({ address })) ?? [],
  };

  const state = currentConfirmation
    ? getMockConfirmStateForTransaction(
        currentConfirmation as TransactionMeta,
        {
          metamask: {
            internalAccounts,
          },
        },
      )
    : {};

  const response = renderHookWithConfirmContextProvider(
    useFirstTimeInteractionAlert,
    state,
  );

  return response.result.current;
}

describe('useFirstTimeInteractionAlert', () => {
  const mockUseTrustSignal = jest.mocked(useTrustSignal);
  const mockIsFirstPartyContract = jest.mocked(getExperience);

  beforeEach(() => {
    jest.resetAllMocks();
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
    mockIsFirstPartyContract.mockReturnValue(undefined);
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
      type: TransactionType.simpleSend,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: ACCOUNT_ADDRESS_2_MOCK,
      },
    };
    expect(
      runHook({
        currentConfirmation: firstTimeConfirmation,
        internalAccountAddresses: [ACCOUNT_ADDRESS_2_MOCK],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if token transfer recipient is internal account', () => {
    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      type: TransactionType.tokenMethodTransfer,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: CONTRACT_ADDRESS_MOCK,
        data: genUnapprovedTokenTransferConfirmation().txParams.data,
      },
    };
    expect(
      runHook({
        currentConfirmation: firstTimeConfirmation,
        internalAccountAddresses: [ACCOUNT_ADDRESS_2_MOCK],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction destination is internal account with different case', () => {
    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      type: TransactionType.simpleSend,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: ACCOUNT_ADDRESS_2_MOCK.toLowerCase(),
      },
    };
    expect(
      runHook({
        currentConfirmation: firstTimeConfirmation,
        internalAccountAddresses: [ACCOUNT_ADDRESS_2_MOCK.toUpperCase()],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction destination is verified', () => {
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Verified,
      label: null,
    });

    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      type: TransactionType.simpleSend,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: ACCOUNT_ADDRESS_2_MOCK,
      },
    };

    expect(
      runHook({
        currentConfirmation: firstTimeConfirmation,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if token transfer recipient is verified', () => {
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Verified,
      label: null,
    });

    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      type: TransactionType.tokenMethodTransfer,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: ACCOUNT_ADDRESS_2_MOCK.toLowerCase(),
        data: genUnapprovedTokenTransferConfirmation().txParams.data,
      },
    };

    expect(
      runHook({
        currentConfirmation: firstTimeConfirmation,
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
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'firstTimeInteractionTitle',
        message:
          "You're interacting with this address for the first time. Make sure that it's correct before you continue.",
        reason: '1st interaction',
        severity: Severity.Warning,
      },
    ]);
  });

  it('does not return alert if recipient is a first-party contract', () => {
    mockIsFirstPartyContract.mockReturnValue(EXPERIENCES_TYPE.METAMASK_BRIDGE);

    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: CONTRACT_ADDRESS_MOCK,
      },
    };

    const alerts = runHook({
      currentConfirmation: firstTimeConfirmation,
    });

    expect(alerts).toEqual([]);
  });
  it('does not return alert when trust signal is still loading', () => {
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Loading,
      label: null,
    });

    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      type: TransactionType.simpleSend,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: ACCOUNT_ADDRESS_2_MOCK,
      },
    };

    const alerts = runHook({
      currentConfirmation: firstTimeConfirmation,
    });

    expect(alerts).toEqual([]);
  });

  it('returns alert when trust signal is loaded but address is not verified', () => {
    // Simulate the trust signal being loaded with non-verified result
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });

    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      type: TransactionType.simpleSend,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: ACCOUNT_ADDRESS_2_MOCK,
      },
    };

    const alerts = runHook({
      currentConfirmation: firstTimeConfirmation,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].key).toBe('firstTimeInteractionTitle');
  });

  it('does not return alert when trust signal shows verified address', () => {
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Verified,
      label: null,
    });

    const firstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      isFirstTimeInteraction: true,
      type: TransactionType.simpleSend,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        to: ACCOUNT_ADDRESS_2_MOCK,
      },
    };

    const alerts = runHook({
      currentConfirmation: firstTimeConfirmation,
    });

    expect(alerts).toEqual([]);
  });
});
