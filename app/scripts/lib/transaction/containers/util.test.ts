import {
  TransactionContainerType,
  TransactionControllerEstimateGasAction,
  TransactionControllerGetStateAction,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import { Messenger } from '@metamask/base-controller';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import {
  applyTransactionContainers,
  applyTransactionContainersExisting,
} from './util';
import { enforceSimulations } from './enforced-simulations';

jest.mock('./enforced-simulations');

const TRANSACTION_ID_MOCK = '123-456';
const CHAIN_ID_MOCK = '0x123' as const;
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
      | TransactionControllerEstimateGasAction
      | TransactionControllerGetStateAction,
      never
    >();

    baseMessenger.registerActionHandler(
      'TransactionController:estimateGas',
      async () => ({ gas: ESTIMATE_GAS_MOCK, simulationFails: { debug: {} } }),
    );

    baseMessenger.registerActionHandler(
      'TransactionController:getState',
      getTransactionControllerStateMock,
    );

    messenger = baseMessenger.getRestricted({
      name: 'TransactionControllerInitMessenger',
      allowedActions: [
        'TransactionController:estimateGas',
        'TransactionController:getState',
      ],
      allowedEvents: [],
    });

    enforceSimulationsMock.mockResolvedValue({
      updateTransaction: (tx) => {
        tx.chainId = CHAIN_ID_MOCK;
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

  describe('applyTransactionContainersExisting', () => {
    it('throws if transaction not found', async () => {
      const updateEditableParams = jest.fn();

      await expect(
        applyTransactionContainersExisting({
          containerTypes: [TransactionContainerType.EnforcedSimulations],
          transactionId: TRANSACTION_ID_MOCK,
          messenger,
          updateEditableParams,
        }),
      ).rejects.toThrow(
        `Transaction with ID ${TRANSACTION_ID_MOCK} not found.`,
      );
    });

    it('calls updateEditableParams with new parameters', async () => {
      getTransactionControllerStateMock.mockReturnValue({
        transactions: [TRANSACTION_META_MOCK],
      });

      const updateEditableParams = jest.fn();

      await applyTransactionContainersExisting({
        containerTypes: [TransactionContainerType.EnforcedSimulations],
        transactionId: TRANSACTION_ID_MOCK,
        messenger,
        updateEditableParams,
      });

      expect(updateEditableParams).toHaveBeenCalledWith(
        TRANSACTION_ID_MOCK,
        expect.objectContaining({
          containerTypes: [TransactionContainerType.EnforcedSimulations],
          data: NEW_DATA_MOCK,
          gas: ESTIMATE_GAS_MOCK,
        }),
      );
    });
  });
});
