import {
  TransactionContainerType,
  TransactionControllerEstimateGasAction,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import { Messenger } from '@metamask/base-controller';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import { applyTransactionContainers } from './util';
import { enforceSimulations } from './enforced-simulations';

jest.mock('./enforced-simulations');

const TRANSACTION_META_MOCK = { txParams: {} } as TransactionMeta;
const CHAIN_ID_MOCK = '0x123' as const;
const ESTIMATE_GAS_MOCK = '0x456' as const;

describe('Container Utils', () => {
  const enforceSimulationsMock = jest.mocked(enforceSimulations);
  let messenger: TransactionControllerInitMessenger;

  beforeEach(() => {
    jest.resetAllMocks();

    const baseMessenger = new Messenger<
      TransactionControllerEstimateGasAction,
      never
    >();

    baseMessenger.registerActionHandler(
      'TransactionController:estimateGas',
      async () => ({ gas: ESTIMATE_GAS_MOCK, simulationFails: { debug: {} } }),
    );

    messenger = baseMessenger.getRestricted({
      name: 'TransactionControllerInitMessenger',
      allowedActions: ['TransactionController:estimateGas'],
      allowedEvents: [],
    });

    enforceSimulationsMock.mockResolvedValue({
      updateTransaction: (tx) => {
        tx.chainId = CHAIN_ID_MOCK;
      },
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

      expect(transactionToUpdate.chainId).toBe(CHAIN_ID_MOCK);
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
