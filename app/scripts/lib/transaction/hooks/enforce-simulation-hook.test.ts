import {
  TransactionContainerType,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { TransactionControllerInitMessenger } from '../../../messenger-client-init/messengers/transaction-controller-messenger';
import { applyTransactionContainers } from '../containers/util';
import { EnforceSimulationHook } from './enforce-simulation-hook';

jest.mock('../containers/util');

const BALANCE_CHANGE_MOCK = {
  difference: '0x1' as Hex,
  isDecrease: true,
  previousBalance: '0x1' as Hex,
  newBalance: '0x0' as Hex,
};

const TRANSACTION_META_MOCK: TransactionMeta = {
  chainId: '0x1',
  delegationAddress: '0x234567890abcdef1234567890abcdef12345678',
  id: '123-456',
  networkClientId: 'mainnet',
  origin: 'test.com',
  simulationData: {
    nativeBalanceChange: BALANCE_CHANGE_MOCK,
    tokenBalanceChanges: [],
  },
  status: TransactionStatus.unapproved,
  time: 123,
  txParams: {
    from: '0x01234567890abcdef1234567890abcdef1234567',
    to: '0x1234567890abcdef1234567890abcdef12345678',
  },
  txParamsOriginal: {
    from: '0x01234567890abcdef1234567890abcdef1234567',
    to: '0x1234567890abcdef1234567890abcdef12345678',
  },
};

describe('EnforceSimulationHook', () => {
  let messenger: TransactionControllerInitMessenger;
  const isDefaultEnabledMock = jest.fn();

  const applyTransactionContainersMock = jest.mocked(
    applyTransactionContainers,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    isDefaultEnabledMock.mockReturnValue(true);

    applyTransactionContainersMock.mockResolvedValue({
      updateTransaction: jest.fn(),
    });

    const baseMessenger = new Messenger<MockAnyNamespace, never, never>({
      namespace: MOCK_ANY_NAMESPACE,
    });

    messenger = new Messenger<
      'TransactionControllerInitMessenger',
      never,
      never,
      typeof baseMessenger
    >({
      namespace: 'TransactionControllerInitMessenger',
      parent: baseMessenger,
    });
  });

  it('applies enforced simulations container if after simulate hook', async () => {
    const updateTransactionMock = jest.fn();

    applyTransactionContainersMock.mockResolvedValue({
      updateTransaction: updateTransactionMock,
    });

    const hook = new EnforceSimulationHook({
      messenger,
      isDefaultEnabled: isDefaultEnabledMock,
    }).getAfterSimulateHook();

    const { updateTransaction } =
      (await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      })) ?? {};

    expect(updateTransaction).toBe(updateTransactionMock);

    expect(applyTransactionContainersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isApproved: false,
      }),
    );
  });

  it('applies enforced simulations container if before sign hook', async () => {
    const updateTransactionMock = jest.fn();

    applyTransactionContainersMock.mockResolvedValue({
      updateTransaction: updateTransactionMock,
    });

    const hook = new EnforceSimulationHook({
      messenger,
      isDefaultEnabled: isDefaultEnabledMock,
    }).getBeforeSignHook();

    const { updateTransaction } =
      (await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      })) ?? {};

    expect(updateTransaction).toBe(updateTransactionMock);

    expect(applyTransactionContainersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isApproved: true,
      }),
    );
  });

  describe('does nothing if', () => {
    it('isDefaultEnabled returns false', async () => {
      isDefaultEnabledMock.mockReturnValue(false);

      const hook = new EnforceSimulationHook({
        messenger,
        isDefaultEnabled: isDefaultEnabledMock,
      }).getAfterSimulateHook();

      const result = await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      });

      expect(result?.skipSimulation).toBe(false);
      expect(applyTransactionContainersMock).not.toHaveBeenCalled();
    });

    it('container types include enforced simulations', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
        isDefaultEnabled: isDefaultEnabledMock,
      }).getAfterSimulateHook();

      const { updateTransaction } =
        (await hook({
          transactionMeta: {
            ...TRANSACTION_META_MOCK,
            containerTypes: [TransactionContainerType.EnforcedSimulations],
          },
        })) ?? {};

      expect(updateTransaction).toBeUndefined();
    });

    it('container types exist but user opted out (empty array)', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
        isDefaultEnabled: isDefaultEnabledMock,
      }).getAfterSimulateHook();

      const { updateTransaction } =
        (await hook({
          transactionMeta: {
            ...TRANSACTION_META_MOCK,
            containerTypes: [],
          },
        })) ?? {};

      expect(updateTransaction).toBeUndefined();
    });

    it('before sign hook respects user opt-out (empty container types)', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
        isDefaultEnabled: isDefaultEnabledMock,
      }).getBeforeSignHook();

      const { updateTransaction } =
        (await hook({
          transactionMeta: {
            ...TRANSACTION_META_MOCK,
            containerTypes: [],
          },
        })) ?? {};

      expect(updateTransaction).toBeUndefined();
      expect(applyTransactionContainersMock).not.toHaveBeenCalled();
    });
  });

  describe('respects user opt-in when isDefaultEnabled is false', () => {
    it('applies enforcement when user opted in via containerTypes', async () => {
      isDefaultEnabledMock.mockReturnValue(false);

      const hook = new EnforceSimulationHook({
        messenger,
        isDefaultEnabled: isDefaultEnabledMock,
      }).getBeforeSignHook();

      await hook({
        transactionMeta: {
          ...TRANSACTION_META_MOCK,
          containerTypes: [TransactionContainerType.EnforcedSimulations],
        },
      });

      expect(applyTransactionContainersMock).toHaveBeenCalled();
    });
  });
});
