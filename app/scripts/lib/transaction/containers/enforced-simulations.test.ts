import {
  SimulationData,
  SimulationTokenStandard,
  TransactionControllerIsAtomicBatchSupportedAction,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { cloneDeep } from 'lodash';
import { DELEGATOR_CONTRACTS } from '@metamask/delegation-deployments';
import { Hex, remove0x } from '@metamask/utils';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import { toHex } from '@metamask/controller-utils';
import { TransactionControllerInitMessenger } from '../../../messenger-client-init/messengers/transaction-controller-messenger';
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

const DELEGATION_ADDRESS_MOCK =
  '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B' as Hex;

const TRANSACTION_META_MOCK: TransactionMeta = {
  chainId: CHAIN_ID_MOCK,
  delegationAddress: DELEGATION_ADDRESS_MOCK,
  id: '123-456',
  simulationData: SIMULATION_DATA_MOCK,
  txParams: TX_PARAMS_MOCK,
} as TransactionMeta;

describe('Enforced Simulations Utils', () => {
  let messenger: TransactionControllerInitMessenger;
  let options: Parameters<typeof enforceSimulations>[0];
  let simulationData: SimulationData;

  const signDelegationMock: jest.MockedFn<
    DelegationControllerSignDelegationAction['handler']
  > = jest.fn();

  const isAtomicBatchSupportedMock: jest.MockedFn<
    TransactionControllerIsAtomicBatchSupportedAction['handler']
  > = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    const baseMessenger = new Messenger<
      MockAnyNamespace,
      | DelegationControllerSignDelegationAction
      | TransactionControllerIsAtomicBatchSupportedAction,
      never
    >({
      namespace: MOCK_ANY_NAMESPACE,
    });

    baseMessenger.registerActionHandler(
      'DelegationController:signDelegation',
      signDelegationMock,
    );

    baseMessenger.registerActionHandler(
      'TransactionController:isAtomicBatchSupported',
      isAtomicBatchSupportedMock,
    );

    messenger = new Messenger<
      'TransactionControllerInitMessenger',
      | DelegationControllerSignDelegationAction
      | TransactionControllerIsAtomicBatchSupportedAction,
      never,
      typeof baseMessenger
    >({
      namespace: 'TransactionControllerInitMessenger',
      parent: baseMessenger,
    });
    baseMessenger.delegate({
      messenger,
      actions: [
        'DelegationController:signDelegation',
        'TransactionController:isAtomicBatchSupported',
      ],
    });

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

    it('throws when no caveats can be generated', async () => {
      const transactionMeta = cloneDeep(TRANSACTION_META_MOCK);
      transactionMeta.simulationData = {
        tokenBalanceChanges: [],
      };

      await expect(
        enforceSimulations({
          ...options,
          transactionMeta,
        }),
      ).rejects.toThrow('No caveats generated for enforced simulations');
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

        const { updateTransaction } = await enforceSimulations(options);

        const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
        updateTransaction?.(newTransaction);

        expect(newTransaction.txParams.data).toStrictEqual(
          expect.stringContaining(remove0x(toHex(110000)).toLowerCase()),
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

        const { updateTransaction } = await enforceSimulations(options);

        const newTransaction = cloneDeep(TRANSACTION_META_MOCK);
        updateTransaction?.(newTransaction);

        expect(newTransaction.txParams.data).toStrictEqual(
          expect.stringContaining(remove0x(toHex(90000)).toLowerCase()),
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

    describe('with non-upgraded account', () => {
      const UPGRADE_CONTRACT_ADDRESS_MOCK =
        '0x1234567890123456789012345678901234567890' as Hex;

      beforeEach(() => {
        options.transactionMeta = cloneDeep({
          ...TRANSACTION_META_MOCK,
          delegationAddress: undefined,
        }) as TransactionMeta;

        isAtomicBatchSupportedMock.mockResolvedValue([
          {
            chainId: CHAIN_ID_MOCK,
            isSupported: false,
            upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
          },
        ]);
      });

      it('sets transaction type to setCode', async () => {
        const { updateTransaction } = await enforceSimulations(options);

        const newTransaction = cloneDeep(options.transactionMeta);
        updateTransaction?.(newTransaction);

        expect(newTransaction.txParams.type).toBe('0x4');
      });

      it('sets minimal authorization list with upgrade contract address', async () => {
        const { updateTransaction } = await enforceSimulations(options);

        const newTransaction = cloneDeep(options.transactionMeta);
        updateTransaction?.(newTransaction);

        expect(newTransaction.txParams.authorizationList).toEqual([
          { address: UPGRADE_CONTRACT_ADDRESS_MOCK },
        ]);
      });
    });
  });
});
