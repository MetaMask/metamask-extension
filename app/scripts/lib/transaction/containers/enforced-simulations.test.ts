import {
  SimulationData,
  SimulationTokenStandard,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { Messenger } from '@metamask/base-controller';
import { cloneDeep } from 'lodash';
import { DELEGATOR_CONTRACTS } from '@metamask/delegation-deployments';
import { Hex, remove0x } from '@metamask/utils';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import { toHex } from '@metamask/controller-utils';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import {
  AppStateControllerGetStateAction,
  AppStateControllerState,
} from '../../../controllers/app-state-controller';
import { enforceSimulations } from './enforced-simulations';

const TOKEN_MOCK = '0x4567890abcdef1234567890abcdef1234567890a' as Hex;
const DELEGATION_SIGNATURE_MOCK = '0x456aaabbbcccdddeee123' as Hex;
const TOKEN_ID_MOCK = '0xabcdef345712ad' as Hex;
const CHAIN_ID_MOCK = '0x1' as Hex;

const BALANCE_CHANGE_MOCK = {
  difference: '0x1' as Hex,
  isDecrease: true,
  previousBalance: '0x1' as Hex,
  newBalance: '0x0' as Hex,
};

const SIMULATION_DATA_MOCK: SimulationData = {
  nativeBalanceChange: BALANCE_CHANGE_MOCK,
  tokenBalanceChanges: [],
};

const TX_PARAMS_MOCK: TransactionParams = {
  from: '0x1234567890abcdef1234567890abcdef12345678' as Hex,
  to: '0xabcdef1234567890abcdef1234567890abcdef12' as Hex,
};

const TRANSACTION_META_MOCK: TransactionMeta = {
  chainId: CHAIN_ID_MOCK,
  id: '123-456',
  simulationData: SIMULATION_DATA_MOCK,
  txParams: TX_PARAMS_MOCK,
} as TransactionMeta;

describe('Enforced Simulations Utils', () => {
  let messenger: TransactionControllerInitMessenger;
  let options: Parameters<typeof enforceSimulations>[0];
  let simulationData: SimulationData;

  const getAppStateMock: jest.MockedFn<
    AppStateControllerGetStateAction['handler']
  > = jest.fn();

  const signDelegationMock: jest.MockedFn<
    DelegationControllerSignDelegationAction['handler']
  > = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    const baseMessenger = new Messenger<
      | AppStateControllerGetStateAction
      | DelegationControllerSignDelegationAction,
      never
    >();

    baseMessenger.registerActionHandler(
      'AppStateController:getState',
      getAppStateMock,
    );

    baseMessenger.registerActionHandler(
      'DelegationController:signDelegation',
      signDelegationMock,
    );

    messenger = baseMessenger.getRestricted({
      name: 'TransactionControllerInitMessenger',
      allowedActions: [
        'AppStateController:getState',
        'DelegationController:signDelegation',
      ],
      allowedEvents: [],
    });

    getAppStateMock.mockReturnValue({
      enforcedSimulationsSlippage: 10,
      enforcedSimulationsSlippageForTransactions: {},
    } as AppStateControllerState);

    signDelegationMock.mockResolvedValue(DELEGATION_SIGNATURE_MOCK);

    options = {
      messenger,
      transactionMeta: cloneDeep(TRANSACTION_META_MOCK),
    };

    simulationData = options.transactionMeta.simulationData as SimulationData;
  });

  describe('enforceSimulations', () => {
    it('updates transaction target to delegation manager', async () => {
      const { updateTransaction } = await enforceSimulations(options);

      const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction?.(newTransaction);

      expect(newTransaction.txParams.to).toBe(
        DELEGATOR_CONTRACTS['1.3.0']['1'].DelegationManager,
      );
    });

    it('updates transaction data to redeemDelegations call', async () => {
      const { updateTransaction } = await enforceSimulations(options);

      const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction?.(newTransaction);

      expect(newTransaction.txParams.data?.substring(0, 10)).toStrictEqual(
        '0xcef6d209',
      );
    });

    it('updates transaction value to zero', async () => {
      const { updateTransaction } = await enforceSimulations(options);

      const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction?.(newTransaction);

      expect(newTransaction.txParams.value).toBe('0x0');
    });

    it('includes native balance change caveat', async () => {
      const { updateTransaction } = await enforceSimulations(options);

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

    it('includes erc20 token balance change caveat', async () => {
      simulationData.tokenBalanceChanges = [
        {
          ...BALANCE_CHANGE_MOCK,
          address: TOKEN_MOCK,
          standard: SimulationTokenStandard.erc20,
        },
      ];

      const { updateTransaction } = await enforceSimulations(options);

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

    it('includes erc721 token balance change caveat', async () => {
      simulationData.tokenBalanceChanges = [
        {
          ...BALANCE_CHANGE_MOCK,
          address: TOKEN_MOCK,
          standard: SimulationTokenStandard.erc721,
        },
      ];

      const { updateTransaction } = await enforceSimulations(options);

      const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction?.(newTransaction);

      expect(newTransaction.txParams.data).toStrictEqual(
        expect.stringContaining(
          remove0x(
            DELEGATOR_CONTRACTS['1.3.0']['1'].ERC721BalanceChangeEnforcer,
          ).toLowerCase(),
        ),
      );
    });

    it('includes erc1155 token balance change caveat', async () => {
      simulationData.tokenBalanceChanges = [
        {
          ...BALANCE_CHANGE_MOCK,
          address: TOKEN_MOCK,
          id: TOKEN_ID_MOCK,
          standard: SimulationTokenStandard.erc1155,
        },
      ];

      const { updateTransaction } = await enforceSimulations(options);

      const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction?.(newTransaction);

      expect(newTransaction.txParams.data).toStrictEqual(
        expect.stringContaining(
          remove0x(
            DELEGATOR_CONTRACTS['1.3.0']['1'].ERC1155BalanceChangeEnforcer,
          ).toLowerCase(),
        ),
      );

      expect(newTransaction.txParams.data).toStrictEqual(
        expect.stringContaining(remove0x(TOKEN_ID_MOCK).toLowerCase()),
      );
    });

    it('signs delegation if useRealSignature', async () => {
      options.useRealSignature = true;

      const { updateTransaction } = await enforceSimulations(options);

      const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
      updateTransaction?.(newTransaction);

      expect(newTransaction.txParams.data).toStrictEqual(
        expect.stringContaining(
          remove0x(DELEGATION_SIGNATURE_MOCK).toLowerCase(),
        ),
      );
    });

    describe('applies slippage', () => {
      it('if decrease', async () => {
        simulationData.tokenBalanceChanges = [
          {
            ...BALANCE_CHANGE_MOCK,
            difference: toHex(100000),
            address: TOKEN_MOCK,
            standard: SimulationTokenStandard.erc20,
          },
        ];

        getAppStateMock.mockReturnValue({
          enforcedSimulationsSlippage: 23,
          enforcedSimulationsSlippageForTransactions: {},
        } as AppStateControllerState);

        const { updateTransaction } = await enforceSimulations(options);

        const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
        updateTransaction?.(newTransaction);

        expect(newTransaction.txParams.data).toStrictEqual(
          expect.stringContaining(remove0x(toHex(123000)).toLowerCase()),
        );
      });

      it('if increase', async () => {
        simulationData.tokenBalanceChanges = [
          {
            ...BALANCE_CHANGE_MOCK,
            isDecrease: false,
            difference: toHex(100000),
            address: TOKEN_MOCK,
            standard: SimulationTokenStandard.erc20,
          },
        ];

        getAppStateMock.mockReturnValue({
          enforcedSimulationsSlippage: 23,
          enforcedSimulationsSlippageForTransactions: {},
        } as AppStateControllerState);

        const { updateTransaction } = await enforceSimulations(options);

        const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
        updateTransaction?.(newTransaction);

        expect(newTransaction.txParams.data).toStrictEqual(
          expect.stringContaining(remove0x(toHex(77000)).toLowerCase()),
        );
      });

      it('if overridden', async () => {
        simulationData.tokenBalanceChanges = [
          {
            ...BALANCE_CHANGE_MOCK,
            isDecrease: false,
            difference: toHex(100000),
            address: TOKEN_MOCK,
            standard: SimulationTokenStandard.erc20,
          },
        ];

        getAppStateMock.mockReturnValue({
          enforcedSimulationsSlippage: 10,
          enforcedSimulationsSlippageForTransactions: {
            [TRANSACTION_META_MOCK.id]: 15,
          },
        } as AppStateControllerState);

        const { updateTransaction } = await enforceSimulations(options);

        const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
        updateTransaction?.(newTransaction);

        expect(newTransaction.txParams.data).toStrictEqual(
          expect.stringContaining(remove0x(toHex(85000)).toLowerCase()),
        );
      });

      // @ts-expect-error Wrong `it` type
      it.each([
        SimulationTokenStandard.erc721,
        SimulationTokenStandard.erc1155,
      ])('unless token is %s', async (standard: SimulationTokenStandard) => {
        simulationData.tokenBalanceChanges = [
          {
            ...BALANCE_CHANGE_MOCK,
            isDecrease: false,
            difference: toHex(100000),
            address: TOKEN_MOCK,
            standard,
          },
        ];

        const { updateTransaction } = await enforceSimulations(options);

        const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
        updateTransaction?.(newTransaction);

        expect(newTransaction.txParams.data).not.toStrictEqual(
          expect.stringContaining(remove0x(toHex(90000)).toLowerCase()),
        );
      });
    });
  });
});
