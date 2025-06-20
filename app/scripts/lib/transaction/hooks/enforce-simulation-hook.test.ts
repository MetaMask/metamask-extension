import {
  TransactionContainerType,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { Messenger } from '@metamask/base-controller';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import { applyTransactionContainers } from '../containers/util';
import { AppStateControllerGetStateAction } from '../../../controllers/app-state-controller';
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

  const applyTransactionContainersMock = jest.mocked(
    applyTransactionContainers,
  );

  const getAppControllerStateMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    process.env.ENABLE_ENFORCED_SIMULATIONS = true as never;

    applyTransactionContainersMock.mockResolvedValue({
      updateTransaction: jest.fn(),
    });

    const baseMessenger = new Messenger<
      AppStateControllerGetStateAction,
      never
    >();

    baseMessenger.registerActionHandler(
      'AppStateController:getState',
      getAppControllerStateMock,
    );

    messenger = baseMessenger.getRestricted({
      name: 'TransactionControllerInitMessenger',
      allowedActions: ['AppStateController:getState'],
      allowedEvents: [],
    });

    getAppControllerStateMock.mockReturnValue({
      enableEnforcedSimulations: true,
      enableEnforcedSimulationsForTransactions: {},
    });
  });

  it('applies enforced simulations container if after simulate hook', async () => {
    const updateTransactionMock = jest.fn();

    applyTransactionContainersMock.mockResolvedValue({
      updateTransaction: updateTransactionMock,
    });

    const hook = new EnforceSimulationHook({
      messenger,
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
    it('transaction is not a delegation', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
      }).getAfterSimulateHook();

      const { updateTransaction } =
        (await hook({
          transactionMeta: {
            ...TRANSACTION_META_MOCK,
            delegationAddress: undefined,
          },
        })) ?? {};

      expect(updateTransaction).toBeUndefined();
    });

    it('no simulation data', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
      }).getAfterSimulateHook();

      const { updateTransaction } =
        (await hook({
          transactionMeta: {
            ...TRANSACTION_META_MOCK,
            simulationData: undefined,
          },
        })) ?? {};

      expect(updateTransaction).toBeUndefined();
    });

    it('transaction is internal', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
      }).getAfterSimulateHook();

      const { updateTransaction } =
        (await hook({
          transactionMeta: {
            ...TRANSACTION_META_MOCK,
            origin: ORIGIN_METAMASK,
          },
        })) ?? {};

      expect(updateTransaction).toBeUndefined();
    });

    it('container types include enforced simulations', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
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

    it('disabled due to default in app state', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
      }).getAfterSimulateHook();

      getAppControllerStateMock.mockReturnValue({
        enableEnforcedSimulations: false,
        enableEnforcedSimulationsForTransactions: {},
      });

      const { updateTransaction } =
        (await hook({
          transactionMeta: TRANSACTION_META_MOCK,
        })) ?? {};

      expect(updateTransaction).toBeUndefined();
    });

    it('disabled due to override in app state', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
      }).getAfterSimulateHook();

      getAppControllerStateMock.mockReturnValue({
        enableEnforcedSimulations: true,
        enableEnforcedSimulationsForTransactions: {
          [TRANSACTION_META_MOCK.id]: false,
        },
      });

      const { updateTransaction } =
        (await hook({
          transactionMeta: TRANSACTION_META_MOCK,
        })) ?? {};

      expect(updateTransaction).toBeUndefined();
    });
  });
});
