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
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
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
  txParams: {},
} as TransactionMeta;

describe('Enforced Simulations Utils', () => {
  let messenger: TransactionControllerInitMessenger;
  let options: Parameters<typeof enforceSimulations>[0];

  const signDelegationMock: jest.MockedFn<
    DelegationControllerSignDelegationAction['handler']
  > = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    const baseMessenger = new Messenger<
      DelegationControllerSignDelegationAction,
      never
    >();

    baseMessenger.registerActionHandler(
      'DelegationController:signDelegation',
      signDelegationMock,
    );

    messenger = baseMessenger.getRestricted({
      name: 'TransactionControllerInitMessenger',
      allowedActions: ['DelegationController:signDelegation'],
      allowedEvents: [],
    });

    signDelegationMock.mockResolvedValue(DELEGATION_SIGNATURE_MOCK);

    options = {
      chainId: CHAIN_ID_MOCK,
      messenger,
      simulationData: cloneDeep(SIMULATION_DATA_MOCK),
      txParams: TX_PARAMS_MOCK,
    };
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
      options.simulationData.tokenBalanceChanges = [
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
      options.simulationData.tokenBalanceChanges = [
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
      options.simulationData.tokenBalanceChanges = [
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
  });
});
