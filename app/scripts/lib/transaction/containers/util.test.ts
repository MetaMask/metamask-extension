import {
  TransactionContainerType,
  TransactionControllerEstimateGasAction,
  TransactionControllerGetStateAction,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { TransactionControllerInitMessenger } from '../../../wallet-init/messengers/transaction-controller-messenger';
import { applyTransactionContainers } from './util';
import { enforceSimulations } from './enforced-simulations';

jest.mock('./enforced-simulations');

const TRANSACTION_ID_MOCK = '123-456';
const ESTIMATE_GAS_MOCK = '0x456' as const;
const NEW_DATA_MOCK = '0x789' as const;

const TRANSACTION_META_MOCK = {
  id: TRANSACTION_ID_MOCK,
  txParams: {},
} as TransactionMeta;

describe('Container Utils', () => {
  const enforceSimulationsMock = jest.mocked(enforceSimulations);
  const getTransactionControllerStateMock = jest.fn();
  let messenger: TransactionControllerInitMessenger;

  beforeEach(() => {
    jest.resetAllMocks();

    const baseMessenger = new Messenger<
      MockAnyNamespace,
      | TransactionControllerEstimateGasAction
      | TransactionControllerGetStateAction,
      never
    >({
      namespace: MOCK_ANY_NAMESPACE,
    });

    baseMessenger.registerActionHandler(
      'TransactionController:estimateGas',
      async () => ({ gas: ESTIMATE_GAS_MOCK, simulationFails: { debug: {} } }),
    );

    baseMessenger.registerActionHandler(
      'TransactionController:getState',
      getTransactionControllerStateMock,
    );

    messenger = new Messenger<
      'TransactionControllerInitMessenger',
      | TransactionControllerEstimateGasAction
      | TransactionControllerGetStateAction,
      never,
      typeof baseMessenger
    >({
      namespace: 'TransactionControllerInitMessenger',
      parent: baseMessenger,
    });
    baseMessenger.delegate({
      messenger,
      actions: [
        'TransactionController:estimateGas',
        'TransactionController:getState',
      ],
    });

    enforceSimulationsMock.mockResolvedValue({
      updateTransaction: (tx) => {
        tx.txParams.data = NEW_DATA_MOCK;
      },
    });

    getTransactionControllerStateMock.mockReturnValue({
      transactions: [],
    });
  });

  describe('applyTransactionContainers', () => {
    it('enforces simulations if container type includes EnforcedSimulations', async () => {
      const { updateTransaction } = await applyTransactionContainers({
        isApproved: true,
        messenger,
        transactionMeta: TRANSACTION_META_MOCK,
        types: [TransactionContainerType.EnforcedSimulations],
      });

      const transactionToUpdate = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction(transactionToUpdate);

      expect(transactionToUpdate.txParams.data).toBe(NEW_DATA_MOCK);
    });

    it('updates gas if not approved', async () => {
      const { updateTransaction } = await applyTransactionContainers({
        isApproved: false,
        messenger,
        transactionMeta: TRANSACTION_META_MOCK,
        types: [TransactionContainerType.EnforcedSimulations],
      });

      const transactionToUpdate = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction(transactionToUpdate);

      expect(transactionToUpdate.txParams.gas).toBe(ESTIMATE_GAS_MOCK);
    });

    it('updates container types', async () => {
      const { updateTransaction } = await applyTransactionContainers({
        isApproved: false,
        messenger,
        transactionMeta: TRANSACTION_META_MOCK,
        types: [TransactionContainerType.EnforcedSimulations],
      });

      const transactionToUpdate = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction(transactionToUpdate);

      expect(transactionToUpdate.containerTypes).toStrictEqual([
        TransactionContainerType.EnforcedSimulations,
      ]);
    });
  });
});
