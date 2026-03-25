import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import {
  TransactionControllerGetNonceLockAction,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  BATCH_DEFAULT_MODE,
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
  createCaveatBuilder,
  getDeleGatorEnvironment,
} from '../../../../shared/lib/delegation';
import {
  createDelegation,
  encodeRedeemDelegations,
} from '../../../../shared/lib/delegation/delegation';

import { stripSingleLeadingZero } from './util';
import {
  convertTransactionToRedeemDelegations,
  DelegationMessenger,
  getDelegationTransaction,
  normalizeCallData,
} from './delegation';

jest.mock('../../../../shared/lib/delegation', () => ({
  ...jest.requireActual('../../../../shared/lib/delegation'),
  encodeRedeemDelegations: jest.fn(),
  createDelegation: jest.fn(),
  createCaveatBuilder: jest.fn(),
  getDeleGatorEnvironment: jest.fn(),
}));

jest.mock('../../../../shared/lib/delegation/delegation', () => ({
  ...jest.requireActual('../../../../shared/lib/delegation/delegation'),
  encodeRedeemDelegations: jest.fn(),
  createDelegation: jest.fn(),
}));

jest.mock('./util', () => ({
  ...jest.requireActual('./util'),
  stripSingleLeadingZero: jest.fn(),
}));

const DELEGATION_MANAGER_ADDRESS_MOCK =
  '0xDelegationManagerAddress' as `0x${string}`;

const CAVEAT_ENFORCER_ADDRESS_MOCK = '0xCaveatEnforcerAddress' as `0x${string}`;

const AUTHORIZATION_SIGNATURE_MOCK = `0x${'1'.repeat(130)}` as `0x${string}`;

const UPGRADE_CONTRACT_ADDRESS_MOCK =
  '0x1234567890123456789012345678901234567899' as `0x${string}`;

const SIGNATURE_MOCK = '0xsignature' as `0x${string}`;
const ENCODED_MOCK = '0xencoded' as `0x${string}`;

const UNSIGNED_DELEGATION_MOCK = {
  from: '0x1234567890123456789012345678901234567890',
  to: '0xffffffffffffffffffffffffffffffffffffffff',
  caveats: [{ enforcer: '0x', terms: '0x', args: '0x' }],
};

const CAVEATS_OVERRIDE_MOCK = [
  { enforcer: '0xaa', terms: '0xbb', args: '0xcc' },
];

const ADDITIONAL_EXECUTION_MOCK: ExecutionStruct = {
  target: '0x9999999999999999999999999999999999999999',
  value: 7n,
  callData: '0xabcdef',
};

const TRANSACTION_META_MOCK = {
  chainId: '0x1',
  networkClientId: 'mainnet',
  txParams: {
    from: '0x1234567890123456789012345678901234567890',
    to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    value: '0x100',
    data: '0xdeadbeef',
  },
} as unknown as TransactionMeta;

describe('delegation', () => {
  const createCaveatBuilderMock = jest.mocked(createCaveatBuilder);
  const getDeleGatorEnvironmentMock = jest.mocked(getDeleGatorEnvironment);
  const createDelegationMock = jest.mocked(createDelegation);
  const encodeRedeemDelegationsMock = jest.mocked(encodeRedeemDelegations);
  const stripSingleLeadingZeroMock = jest.mocked(stripSingleLeadingZero);

  const signDelegationMock: jest.MockedFn<
    DelegationControllerSignDelegationAction['handler']
  > = jest.fn();

  const signEip7702AuthorizationMock: jest.MockedFn<
    KeyringControllerSignEip7702AuthorizationAction['handler']
  > = jest.fn();

  const getNonceLockMock: jest.MockedFn<
    TransactionControllerGetNonceLockAction['handler']
  > = jest.fn();

  let messenger: DelegationMessenger;
  let addCaveatMock: jest.Mock;
  let buildCaveatMock: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    const baseMessenger = new Messenger<
      MockAnyNamespace,
      | DelegationControllerSignDelegationAction
      | KeyringControllerSignEip7702AuthorizationAction
      | TransactionControllerGetNonceLockAction,
      never
    >({
      namespace: MOCK_ANY_NAMESPACE,
    });

    const childMessenger = new Messenger<
      'TestDelegation',
      | DelegationControllerSignDelegationAction
      | KeyringControllerSignEip7702AuthorizationAction
      | TransactionControllerGetNonceLockAction,
      never,
      typeof baseMessenger
    >({
      namespace: 'TestDelegation',
      parent: baseMessenger,
    });

    baseMessenger.delegate({
      messenger: childMessenger,
      actions: [
        'DelegationController:signDelegation',
        'KeyringController:signEip7702Authorization',
        'TransactionController:getNonceLock',
      ] as never,
    });

    baseMessenger.registerActionHandler(
      'DelegationController:signDelegation',
      signDelegationMock,
    );

    baseMessenger.registerActionHandler(
      'KeyringController:signEip7702Authorization',
      signEip7702AuthorizationMock,
    );

    baseMessenger.registerActionHandler(
      'TransactionController:getNonceLock',
      getNonceLockMock,
    );

    messenger = childMessenger as DelegationMessenger;

    addCaveatMock = jest.fn();

    buildCaveatMock = jest
      .fn()
      .mockReturnValue([{ enforcer: '0x', terms: '0x', args: '0x' }]);

    createCaveatBuilderMock.mockReturnValue({
      addCaveat: addCaveatMock,
      build: buildCaveatMock,
    } as never);

    getDeleGatorEnvironmentMock.mockReturnValue({
      DelegationManager: DELEGATION_MANAGER_ADDRESS_MOCK,
      ExactExecutionEnforcer: CAVEAT_ENFORCER_ADDRESS_MOCK,
      ExactExecutionBatchEnforcer: CAVEAT_ENFORCER_ADDRESS_MOCK,
      LimitedCallsEnforcer: CAVEAT_ENFORCER_ADDRESS_MOCK,
    } as never);

    createDelegationMock.mockReturnValue(UNSIGNED_DELEGATION_MOCK as never);
    encodeRedeemDelegationsMock.mockReturnValue(ENCODED_MOCK);
    signDelegationMock.mockResolvedValue(SIGNATURE_MOCK);

    signEip7702AuthorizationMock.mockResolvedValue(
      AUTHORIZATION_SIGNATURE_MOCK,
    );

    getNonceLockMock.mockResolvedValue({
      nextNonce: 9,
      releaseLock: jest.fn(),
    } as never);

    stripSingleLeadingZeroMock.mockImplementation((value) => value as never);
  });

  describe('convertTransactionToRedeemDelegations', () => {
    it('uses nestedTransactions for executions and caveats when available', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        nestedTransactions: [
          {
            to: '0x1111111111111111111111111111111111111111',
            value: '0x2',
            data: '0xaaaa',
          },
          {
            to: '0x2222222222222222222222222222222222222222',
            value: '0x3',
            data: '0xbbbb',
          },
        ],
      } as unknown as TransactionMeta;

      await convertTransactionToRedeemDelegations({ transaction, messenger });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: '0x1111111111111111111111111111111111111111',
                value: 2n,
                callData: '0xaaaa',
              },
              {
                target: '0x2222222222222222222222222222222222222222',
                value: 3n,
                callData: '0xbbbb',
              },
            ],
          ],
        }),
      );

      expect(addCaveatMock).toHaveBeenCalledTimes(2);
      expect(buildCaveatMock).toHaveBeenCalledTimes(1);
    });

    it('normalizes nestedTransactions callData', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        nestedTransactions: [
          {
            to: '0x1111111111111111111111111111111111111111',
            value: '0x0',
          },
        ],
      } as unknown as TransactionMeta;

      await convertTransactionToRedeemDelegations({ transaction, messenger });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              expect.objectContaining({
                callData: '0x',
              }),
            ],
          ],
        }),
      );
    });

    it('falls back to txParams when nestedTransactions is empty', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        nestedTransactions: [],
      } as unknown as TransactionMeta;

      await convertTransactionToRedeemDelegations({ transaction, messenger });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
                callData: '0xdeadbeef',
              },
            ],
          ],
        }),
      );
    });

    it('falls back to txParams when nestedTransactions is absent', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
                callData: '0xdeadbeef',
              },
            ],
          ],
        }),
      );
    });

    it('falls back to txParams when nestedTransactions have no to field', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        nestedTransactions: [{ type: 'swap' }],
      } as unknown as TransactionMeta;

      await convertTransactionToRedeemDelegations({ transaction, messenger });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
                callData: '0xdeadbeef',
              },
            ],
          ],
        }),
      );
    });

    it('appends additionalExecutions to default executions', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        additionalExecutions: [ADDITIONAL_EXECUTION_MOCK],
      });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
                callData: '0xdeadbeef',
              },
              ADDITIONAL_EXECUTION_MOCK,
            ],
          ],
        }),
      );
    });

    it('includes additionalExecutions in default caveats', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        additionalExecutions: [ADDITIONAL_EXECUTION_MOCK],
      });

      expect(addCaveatMock).toHaveBeenCalledWith(
        'exactExecutionBatch',
        expect.arrayContaining([
          expect.objectContaining({
            to: ADDITIONAL_EXECUTION_MOCK.target,
          }),
        ]),
      );
    });

    it('uses provided caveats override instead of defaults', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        caveats: CAVEATS_OVERRIDE_MOCK as never,
      });

      expect(createCaveatBuilderMock).not.toHaveBeenCalled();
      expect(createDelegationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          caveats: CAVEATS_OVERRIDE_MOCK,
        }),
      );
    });

    it('uses SINGLE_DEFAULT_MODE for single execution', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          modes: [SINGLE_DEFAULT_MODE],
        }),
      );
    });

    it('uses BATCH_DEFAULT_MODE for multiple executions', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        additionalExecutions: [ADDITIONAL_EXECUTION_MOCK],
      });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          modes: [BATCH_DEFAULT_MODE],
        }),
      );
    });

    it('signs delegation via DelegationController:signDelegation messenger action', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(signDelegationMock).toHaveBeenCalledWith({
        chainId: '0x1',
        delegation: UNSIGNED_DELEGATION_MOCK,
      });
      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          delegations: [
            [{ ...UNSIGNED_DELEGATION_MOCK, signature: SIGNATURE_MOCK }],
          ],
        }),
      );
    });

    it('returns delegation manager address as to', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(result.to).toBe(DELEGATION_MANAGER_ADDRESS_MOCK);
    });

    it('builds authorization list when authorization.upgradeContractAddress is provided', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      });

      expect(getNonceLockMock).toHaveBeenCalledWith(
        TRANSACTION_META_MOCK.txParams.from,
        'mainnet',
      );
      expect(signEip7702AuthorizationMock).toHaveBeenCalledWith({
        chainId: 1,
        contractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        from: TRANSACTION_META_MOCK.txParams.from,
        nonce: 9,
      });
      expect(stripSingleLeadingZeroMock).toHaveBeenCalledTimes(2);
      expect(result.authorizationList).toEqual([
        {
          address: UPGRADE_CONTRACT_ADDRESS_MOCK,
          chainId: '0x1',
          nonce: '0x9',
          r: `0x${'1'.repeat(64)}`,
          s: `0x${'1'.repeat(64)}`,
          yParity: '0x1',
        },
      ]);
    });

    it('skips authorization list when authorization is omitted', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(result.authorizationList).toBeUndefined();
      expect(getNonceLockMock).not.toHaveBeenCalled();
      expect(signEip7702AuthorizationMock).not.toHaveBeenCalled();
    });

    it('throws when authorization has no upgradeContractAddress and no isAtomicBatchSupported', async () => {
      await expect(
        convertTransactionToRedeemDelegations({
          transaction: TRANSACTION_META_MOCK,
          messenger,
          authorization: {
            upgradeContractAddress: undefined,
          },
        }),
      ).rejects.toThrow('Upgrade contract address not found');
    });

    it('resolves authorization via isAtomicBatchSupported when that variant is used', async () => {
      const isAtomicBatchSupported = jest.fn().mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: false,
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {
          isAtomicBatchSupported,
        },
      });

      expect(isAtomicBatchSupported).toHaveBeenCalledWith({
        address: TRANSACTION_META_MOCK.txParams.from,
        chainIds: ['0x1'],
      });

      expect(signEip7702AuthorizationMock).toHaveBeenCalledTimes(1);
    });

    it('throws when isAtomicBatchSupported returns no upgradeContractAddress', async () => {
      await expect(
        convertTransactionToRedeemDelegations({
          transaction: TRANSACTION_META_MOCK,
          messenger,
          authorization: {
            isAtomicBatchSupported: jest
              .fn()
              .mockResolvedValue([{ chainId: '0x1', isSupported: false }]),
          },
        }),
      ).rejects.toThrow('Upgrade contract address not found');
    });

    it('throws when chain is not in isAtomicBatchSupported result', async () => {
      await expect(
        convertTransactionToRedeemDelegations({
          transaction: TRANSACTION_META_MOCK,
          messenger,
          authorization: {
            isAtomicBatchSupported: jest
              .fn()
              .mockResolvedValue([{ chainId: '0x999', isSupported: false }]),
          },
        }),
      ).rejects.toThrow('Chain does not support EIP-7702');
    });

    it('skips authorization when already upgraded and isSupported', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {
          isAtomicBatchSupported: jest.fn().mockResolvedValue([
            {
              chainId: '0x1',
              isSupported: true,
              delegationAddress: '0xexisting',
              upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
            },
          ]),
        },
      });

      expect(result.authorizationList).toBeUndefined();
      expect(signEip7702AuthorizationMock).not.toHaveBeenCalled();
    });

    it('throws when upgraded to different address and upgradeExistingDelegation is false', async () => {
      await expect(
        convertTransactionToRedeemDelegations({
          transaction: TRANSACTION_META_MOCK,
          messenger,
          authorization: {
            isAtomicBatchSupported: jest.fn().mockResolvedValue([
              {
                chainId: '0x1',
                isSupported: false,
                delegationAddress: '0xdifferent',
                upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
              },
            ]),
            upgradeExistingDelegation: false,
          },
        }),
      ).rejects.toThrow(
        'Account is already upgraded to a different delegation address',
      );
    });

    it('overwrites delegation when upgraded to different address by default', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {
          isAtomicBatchSupported: jest.fn().mockResolvedValue([
            {
              chainId: '0x1',
              isSupported: false,
              delegationAddress: '0xdifferent',
              upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
            },
          ]),
        },
      });

      expect(result.authorizationList).toBeDefined();
      expect(signEip7702AuthorizationMock).toHaveBeenCalledTimes(1);
    });

    it('overwrites delegation when upgraded to different address and upgradeExistingDelegation is true', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {
          isAtomicBatchSupported: jest.fn().mockResolvedValue([
            {
              chainId: '0x1',
              isSupported: false,
              delegationAddress: '0xdifferent',
              upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
            },
          ]),
          upgradeExistingDelegation: true,
        },
      });

      expect(result.authorizationList).toBeDefined();
      expect(signEip7702AuthorizationMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDelegationTransaction', () => {
    it('adds value 0x0 to converted delegation transaction', async () => {
      const result = await getDelegationTransaction(
        {
          messenger,
          isAtomicBatchSupported: jest.fn().mockResolvedValue([
            {
              chainId: '0x1',
              isSupported: false,
              upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
            },
          ]),
        },
        TRANSACTION_META_MOCK,
      );

      expect(result).toEqual(
        expect.objectContaining({
          data: ENCODED_MOCK,
          to: DELEGATION_MANAGER_ADDRESS_MOCK,
          value: '0x0',
        }),
      );
    });

    it('passes isAtomicBatchSupported through to authorization', async () => {
      const isAtomicBatchSupported = jest.fn().mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: false,
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      await getDelegationTransaction(
        {
          messenger,
          isAtomicBatchSupported,
        },
        TRANSACTION_META_MOCK,
      );

      expect(isAtomicBatchSupported).toHaveBeenCalledWith({
        address: TRANSACTION_META_MOCK.txParams.from,
        chainIds: ['0x1'],
      });
    });
  });

  describe('normalizeCallData', () => {
    it('returns 0x for undefined', () => {
      expect(normalizeCallData(undefined)).toBe('0x');
    });

    it('returns 0x for null', () => {
      expect(normalizeCallData(null)).toBe('0x');
    });

    it('returns 0x for empty string', () => {
      expect(normalizeCallData('')).toBe('0x');
    });

    it('returns 0x for 0x', () => {
      expect(normalizeCallData('0x')).toBe('0x');
    });

    it('preserves valid hex data', () => {
      expect(normalizeCallData('0xdeadbeef')).toBe('0xdeadbeef');
    });

    it('lowercases hex', () => {
      expect(normalizeCallData('0xDEADBEEF')).toBe('0xdeadbeef');
    });

    it('adds 0x prefix if missing', () => {
      expect(normalizeCallData('deadbeef')).toBe('0xdeadbeef');
    });

    it('pads odd-length hex body', () => {
      expect(normalizeCallData('0xabc')).toBe('0x0abc');
      expect(normalizeCallData('abc')).toBe('0x0abc');
    });
  });
});
