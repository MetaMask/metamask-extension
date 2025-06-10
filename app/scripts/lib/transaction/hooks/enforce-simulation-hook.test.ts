import {
  SimulationTokenStandard,
  TransactionControllerEstimateGasAction,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { EnforceSimulationHook } from './enforce-simulation-hook';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import { Messenger } from '@metamask/base-controller';
import { cloneDeep } from 'lodash';
import { DELEGATOR_CONTRACTS } from '@metamask/delegation-deployments';
import { Hex, remove0x } from '@metamask/utils';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';

const ESTIMATE_GAS_MOCK = '0x123' as Hex;
const TOKEN_MOCK = '0x4567890abcdef1234567890abcdef1234567890a' as Hex;
const DELEGATION_SIGNATURE_MOCK = '0x456aaabbbcccdddeee123' as Hex;

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

  const estimateGasMock: jest.MockedFn<
    TransactionControllerEstimateGasAction['handler']
  > = jest.fn();

  const signDelegationMock: jest.MockedFn<
    DelegationControllerSignDelegationAction['handler']
  > = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    process.env.ENABLE_ENFORCED_SIMULATIONS = 'true';

    const baseMessenger = new Messenger<
      | DelegationControllerSignDelegationAction
      | TransactionControllerEstimateGasAction,
      never
    >();

    baseMessenger.registerActionHandler(
      'TransactionController:estimateGas',
      estimateGasMock,
    );

    baseMessenger.registerActionHandler(
      'DelegationController:signDelegation',
      signDelegationMock,
    );

    messenger = baseMessenger.getRestricted({
      name: 'TransactionControllerInitMessenger',
      allowedActions: [
        'DelegationController:signDelegation',
        'TransactionController:estimateGas',
      ],
      allowedEvents: [],
    });

    estimateGasMock.mockResolvedValue({
      gas: ESTIMATE_GAS_MOCK,
      simulationFails: {
        debug: {},
      },
    });

    signDelegationMock.mockResolvedValue(DELEGATION_SIGNATURE_MOCK);
  });

  it('updates transaction target to delegation manager', async () => {
    const hook = new EnforceSimulationHook({
      messenger,
    }).getAfterSimulateHook();

    const { updateTransaction } =
      (await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      })) ?? {};

    const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
    updateTransaction?.(newTransaction);

    expect(newTransaction.txParams.to).toBe(
      DELEGATOR_CONTRACTS['1.3.0']['1'].DelegationManager,
    );
  });

  it('updates transaction data to redeemDelegations call', async () => {
    const hook = new EnforceSimulationHook({
      messenger,
    }).getAfterSimulateHook();

    const { updateTransaction } =
      (await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      })) ?? {};

    const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
    updateTransaction?.(newTransaction);

    expect(newTransaction.txParams.data?.substring(0, 10)).toStrictEqual(
      '0xcef6d209',
    );
  });

  it('updates transaction value to zero', async () => {
    const hook = new EnforceSimulationHook({
      messenger,
    }).getAfterSimulateHook();

    const { updateTransaction } =
      (await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      })) ?? {};

    const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
    updateTransaction?.(newTransaction);

    expect(newTransaction.txParams.value).toBe('0x0');
  });

  it('includes native balance change caveat if native balance changed', async () => {
    const hook = new EnforceSimulationHook({
      messenger,
    }).getAfterSimulateHook();

    const { updateTransaction } =
      (await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      })) ?? {};

    const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
    updateTransaction?.(newTransaction);

    expect(newTransaction.txParams.data).toStrictEqual(
      expect.stringContaining(
        remove0x(
          DELEGATOR_CONTRACTS['1.3.0']['1'].NativeBalanceChangeEnforcer,
        ).toLowerCase(),
      ),
    );
  });

  it('includes erc20 token balance change caveat if erc20 token balance changed', async () => {
    const hook = new EnforceSimulationHook({
      messenger,
    }).getAfterSimulateHook();

    const { updateTransaction } =
      (await hook({
        transactionMeta: {
          ...TRANSACTION_META_MOCK,
          simulationData: {
            tokenBalanceChanges: [
              {
                ...BALANCE_CHANGE_MOCK,
                address: TOKEN_MOCK,
                standard: SimulationTokenStandard.erc20,
              },
            ],
          },
        },
      })) ?? {};

    const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
    updateTransaction?.(newTransaction);

    expect(newTransaction.txParams.data).toStrictEqual(
      expect.stringContaining(
        remove0x(
          DELEGATOR_CONTRACTS['1.3.0']['1'].ERC20BalanceChangeEnforcer,
        ).toLowerCase(),
      ),
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

    it('env is disabled', async () => {
      process.env.ENABLE_ENFORCED_SIMULATIONS = 'false';

      const hook = new EnforceSimulationHook({
        messenger,
      }).getAfterSimulateHook();

      const { updateTransaction } =
        (await hook({
          transactionMeta: TRANSACTION_META_MOCK,
        })) ?? {};

      expect(updateTransaction).toBeUndefined();
    });
  });

  describe('if before sign hook', () => {
    it('signs delegation', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
      }).getBeforeSignHook();

      const { updateTransaction } =
        (await hook({
          transactionMeta: TRANSACTION_META_MOCK,
        })) ?? {};

      const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction?.(newTransaction);

      expect(newTransaction.txParams.data).toStrictEqual(
        expect.stringContaining(
          remove0x(DELEGATION_SIGNATURE_MOCK).toLowerCase(),
        ),
      );
    });

    it('does not estimate gas', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
      }).getBeforeSignHook();

      await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      });

      expect(estimateGasMock).not.toHaveBeenCalled();
    });
  });
});
