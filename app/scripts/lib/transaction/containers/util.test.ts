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
  const estimateGasMock = jest.fn();
  const getTransactionControllerStateMock = jest.fn();
  let messenger: TransactionControllerInitMessenger;

  beforeEach(() => {
    jest.resetAllMocks();

    estimateGasMock.mockResolvedValue({
      gas: ESTIMATE_GAS_MOCK,
      simulationFails: undefined,
    });

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
      estimateGasMock,
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

    it('updates gas from a successful preview estimate', async () => {
      const { updateTransaction } = await applyTransactionContainers({
        isApproved: false,
        messenger,
        transactionMeta: TRANSACTION_META_MOCK,
        types: [TransactionContainerType.EnforcedSimulations],
      });

      const transactionToUpdate = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction(transactionToUpdate);

      expect(transactionToUpdate.txParams.gas).toBe(ESTIMATE_GAS_MOCK);
      expect(estimateGasMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: NEW_DATA_MOCK }),
        undefined,
        { ignoreDelegationSignatures: true },
      );
    });

    it('rejects preview when the estimate uses a failure fallback', async () => {
      estimateGasMock.mockResolvedValue({
        gas: '0x29b92700',
        simulationFails: {
          reason: 'No simulated gas returned',
          debug: { blockGasLimit: '0x77359400' },
        },
      });

      const transactionMeta = {
        ...TRANSACTION_META_MOCK,
        txParams: { gas: '0x29b92700' },
        txParamsOriginal: { gas: '0x554af' },
      } as TransactionMeta;

      await expect(
        applyTransactionContainers({
          isApproved: false,
          messenger,
          transactionMeta,
          types: [TransactionContainerType.EnforcedSimulations],
        }),
      ).rejects.toThrow(
        'Failed to estimate gas for transaction containers: No simulated gas returned',
      );
    });

    it('re-estimates gas with the real signature when approved', async () => {
      const transactionMeta = {
        ...TRANSACTION_META_MOCK,
        txParams: { gas: '0x123', gasLimit: '0x123' },
      } as TransactionMeta;

      const { updateTransaction } = await applyTransactionContainers({
        isApproved: true,
        messenger,
        transactionMeta,
        types: [TransactionContainerType.EnforcedSimulations],
      });

      const transactionToUpdate = cloneDeep(transactionMeta);
      updateTransaction(transactionToUpdate);

      expect(transactionToUpdate.txParams.gas).toBe(ESTIMATE_GAS_MOCK);
      expect(transactionToUpdate.txParams.gasLimit).toBe(ESTIMATE_GAS_MOCK);
      expect(estimateGasMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: NEW_DATA_MOCK }),
        undefined,
      );
      expect(estimateGasMock.mock.calls[0][0]).not.toHaveProperty('gas');
      expect(estimateGasMock.mock.calls[0][0]).not.toHaveProperty('gasLimit');
    });

    it('preserves the original gas when the real-signature estimate fails', async () => {
      estimateGasMock.mockResolvedValue({
        gas: '0x29b92700',
        simulationFails: {
          reason: 'Failed to estimate signed wrapped transaction',
          debug: { blockGasLimit: '0x77359400' },
        },
      });

      const { updateTransaction } = await applyTransactionContainers({
        isApproved: true,
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
